import { Subasta } from '../../src/dominio/entidades/Subasta';
import { Articulo } from '../../src/dominio/objetos-valor/Articulo';
import { Dinero } from '../../src/dominio/objetos-valor/Dinero';
import {
  DuracionSubastaInvalidaError,
  FechaCierreAnteriorAPublicacionError,
  IncrementoMinimoInvalidoError,
  PrecioBaseInvalidoError,
  SubastaConPujasNoCancelableError,
} from '../../src/dominio/errores/ErrorDeDominio';

const AHORA = new Date('2026-01-01T00:00:00.000Z');
const UNA_HORA_MS = 60 * 60 * 1000;
const UN_DIA_MS = 24 * UNA_HORA_MS;

function articuloDePrueba(): Articulo {
  return Articulo.crear({
    denominacion: 'Reloj antiguo',
    descripcion: 'Reloj de bolsillo en buen estado',
    estadoConservacion: 'BUEN_ESTADO',
    categoriaId: 'coleccionables',
  });
}

function publicarSubastaDePrueba(overrides: Partial<{
  vendedorId: string;
  precioBase: number;
  incrementoMinimo: number;
  fechaCierre: Date;
  ahora: Date;
}> = {}): Subasta {
  const ahora = overrides.ahora ?? AHORA;
  return Subasta.publicar(
    {
      id: 'subasta-1',
      vendedorId: overrides.vendedorId ?? 'vendedor-1',
      articulo: articuloDePrueba(),
      precioBase: Dinero.pesos(overrides.precioBase ?? 100000),
      incrementoMinimo: Dinero.pesos(overrides.incrementoMinimo ?? 10000),
      fechaCierre: overrides.fechaCierre ?? new Date(ahora.getTime() + UN_DIA_MS),
    },
    ahora,
  );
}

describe('Publicación de subastas', () => {
  test('publica correctamente con datos válidos', () => {
    const subasta = publicarSubastaDePrueba();
    expect(subasta.estadoActual.esAbierta()).toBe(true);
    expect(subasta.ofertaVigente()).toBeNull();
  });

  test('rechaza precio base menor o igual a cero', () => {
    expect(() => publicarSubastaDePrueba({ precioBase: 0 })).toThrow(PrecioBaseInvalidoError);
  });

  test('rechaza incremento mínimo menor o igual a cero', () => {
    expect(() => publicarSubastaDePrueba({ incrementoMinimo: 0 })).toThrow(IncrementoMinimoInvalidoError);
  });

  test('rechaza una fecha de cierre anterior o igual a la publicación', () => {
    expect(() => publicarSubastaDePrueba({ fechaCierre: AHORA })).toThrow(FechaCierreAnteriorAPublicacionError);
  });

  test('rechaza una duración menor a una hora', () => {
    expect(() =>
      publicarSubastaDePrueba({ fechaCierre: new Date(AHORA.getTime() + UNA_HORA_MS - 1) }),
    ).toThrow(DuracionSubastaInvalidaError);
  });

  test('rechaza una duración mayor a treinta días', () => {
    expect(() =>
      publicarSubastaDePrueba({ fechaCierre: new Date(AHORA.getTime() + 30 * UN_DIA_MS + 1) }),
    ).toThrow(DuracionSubastaInvalidaError);
  });
});

describe('Cancelación de subastas', () => {
  test('permite cancelar una subasta sin pujas', () => {
    const subasta = publicarSubastaDePrueba();
    subasta.cancelar('vendedor-1', AHORA);
    expect(subasta.estadoActual.valor).toBe('CANCELADA');
  });

  test('impide cancelar una subasta que ya recibió una puja', () => {
    const subasta = publicarSubastaDePrueba();
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);
    expect(() => subasta.cancelar('vendedor-1', AHORA)).toThrow(SubastaConPujasNoCancelableError);
  });
});

describe('Aceptación y rechazo de pujas', () => {
  test('acepta la primera puja igual al precio base', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000 });
    const puja = subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);
    expect(puja.valorOfertado.valor).toBe(100000);
    expect(subasta.ofertaVigente()?.valor).toBe(100000);
  });

  test('rechaza la primera puja por debajo del precio base', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000 });
    expect(() => subasta.registrarPuja('postor-1', Dinero.pesos(50000), AHORA)).toThrow(
      'La primera puja de la subasta debe ser mayor o igual al precio base.',
    );
  });

  test('el vendedor no puede pujar por su propio artículo', () => {
    const subasta = publicarSubastaDePrueba({ vendedorId: 'vendedor-1' });
    expect(() => subasta.registrarPuja('vendedor-1', Dinero.pesos(100000), AHORA)).toThrow(
      'Un usuario no puede pujar por un artículo que él mismo publicó.',
    );
  });

  test('una puja posterior debe superar la vigente en al menos el incremento mínimo', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000, incrementoMinimo: 10000 });
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);

    expect(() => subasta.registrarPuja('postor-2', Dinero.pesos(105000), AHORA)).toThrow(/monto mínimo requerido/i);
  });

  test('una oferta igual a la vigente se rechaza', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000, incrementoMinimo: 10000 });
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);
    expect(() => subasta.registrarPuja('postor-2', Dinero.pesos(100000), AHORA)).toThrow();
  });

  test('acepta una puja que cumple exactamente el incremento mínimo', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000, incrementoMinimo: 10000 });
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);
    const segunda = subasta.registrarPuja('postor-2', Dinero.pesos(110000), AHORA);
    expect(segunda.valorOfertado.valor).toBe(110000);
  });

  test('el mejor postor no puede superar su propia puja', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000, incrementoMinimo: 10000 });
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);
    expect(() => subasta.registrarPuja('postor-1', Dinero.pesos(200000), AHORA)).toThrow(
      'El usuario ya es el mejor postor vigente; no puede superar su propia puja.',
    );
  });

  test('no se aceptan pujas sobre una subasta cancelada', () => {
    const subasta = publicarSubastaDePrueba();
    subasta.cancelar('vendedor-1', AHORA);
    expect(() => subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA)).toThrow(/no admite ofertas/i);
  });

  test('toda puja rechazada queda registrada como intento fallido', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000 });
    expect(() => subasta.registrarPuja('postor-1', Dinero.pesos(50000), AHORA)).toThrow();

    expect(subasta.intentosFallidos).toHaveLength(1);
    expect(subasta.intentosFallidos[0].motivo).toBe('RN08_PRIMERA_PUJA_INSUFICIENTE');
    expect(subasta.intentosFallidos[0].idPostor).toBe('postor-1');
  });
});

describe('Cierre y adjudicación', () => {
  test('una subasta sin pujas se declara desierta al cerrar', () => {
    const fechaCierre = new Date(AHORA.getTime() + UNA_HORA_MS * 2);
    const subasta = publicarSubastaDePrueba({ fechaCierre });

    subasta.sincronizarCierre(new Date(fechaCierre.getTime() + 1));

    expect(subasta.estadoActual.valor).toBe('DESIERTA');
    expect(subasta.ordenDePago).toBeUndefined();
  });

  test('una subasta con pujas se adjudica al mejor postor y genera orden de pago', () => {
    const fechaCierre = new Date(AHORA.getTime() + UNA_HORA_MS * 2);
    const subasta = publicarSubastaDePrueba({ fechaCierre, precioBase: 100000, incrementoMinimo: 10000 });

    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);
    subasta.registrarPuja('postor-2', Dinero.pesos(150000), AHORA);

    const momentoCierre = new Date(fechaCierre.getTime() + 1);
    subasta.sincronizarCierre(momentoCierre);

    expect(subasta.estadoActual.valor).toBe('ADJUDICADA');
    expect(subasta.mejorPostorActualId()).toBe('postor-2');
    expect(subasta.ordenDePago).toBeDefined();
    expect(subasta.ordenDePago?.idGanador).toBe('postor-2');
    expect(subasta.ordenDePago?.valor.valor).toBe(150000);
  });

  test('una subasta vencida no admite más pujas aunque no se haya consultado antes', () => {
    const fechaCierre = new Date(AHORA.getTime() + UNA_HORA_MS * 2);
    const subasta = publicarSubastaDePrueba({ fechaCierre, precioBase: 100000 });
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);

    const momentoTardio = new Date(fechaCierre.getTime() + 1);
    expect(() => subasta.registrarPuja('postor-2', Dinero.pesos(200000), momentoTardio)).toThrow(/no admite ofertas/i);
    expect(subasta.estadoActual.valor).toBe('ADJUDICADA');
  });

  test('un segundo cierre no altera el resultado ni duplica la orden de pago', () => {
    const fechaCierre = new Date(AHORA.getTime() + UNA_HORA_MS * 2);
    const subasta = publicarSubastaDePrueba({ fechaCierre, precioBase: 100000 });
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);

    const momentoCierre = new Date(fechaCierre.getTime() + 1);
    subasta.sincronizarCierre(momentoCierre);
    const ordenOriginal = subasta.ordenDePago;

    subasta.sincronizarCierre(new Date(momentoCierre.getTime() + UN_DIA_MS));

    expect(subasta.ordenDePago).toBe(ordenOriginal);
    expect(subasta.estadoActual.valor).toBe('ADJUDICADA');
  });
});

describe('Eventos de dominio', () => {
  test('una puja aceptada produce un evento NUEVA_PUJA_VIGENTE', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000 });
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);

    const eventos = subasta.extraerEventosPendientes();
    expect(eventos).toContainEqual({
      tipo: 'NUEVA_PUJA_VIGENTE',
      subastaId: 'subasta-1',
      postorId: 'postor-1',
      monto: 100000,
    });
  });

  test('superar a un postor produce también un evento POSTOR_SUPERADO', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000, incrementoMinimo: 10000 });
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);
    subasta.extraerEventosPendientes();

    subasta.registrarPuja('postor-2', Dinero.pesos(150000), AHORA);
    const eventos = subasta.extraerEventosPendientes();

    expect(eventos).toContainEqual({
      tipo: 'POSTOR_SUPERADO',
      subastaId: 'subasta-1',
      postorSuperadoId: 'postor-1',
      nuevoMonto: 150000,
    });
  });

  test('extraerEventosPendientes limpia la lista tras leerla', () => {
    const subasta = publicarSubastaDePrueba({ precioBase: 100000 });
    subasta.registrarPuja('postor-1', Dinero.pesos(100000), AHORA);

    subasta.extraerEventosPendientes();
    expect(subasta.extraerEventosPendientes()).toHaveLength(0);
  });
});

import { Subasta } from '../../src/dominio/entidades/Subasta';
import { Usuario } from '../../src/dominio/entidades/Usuario';
import { Articulo } from '../../src/dominio/objetos-valor/Articulo';
import { Dinero } from '../../src/dominio/objetos-valor/Dinero';
import { Email } from '../../src/dominio/objetos-valor/Email';
import { abrirBaseDatosSqlite, ConexionSqlite } from '../../src/infraestructura/persistencia/sqlite/BaseDatosSqlite';
import { SubastaRepositorioSqlite } from '../../src/infraestructura/persistencia/sqlite/SubastaRepositorioSqlite';
import { UsuarioRepositorioSqlite } from '../../src/infraestructura/persistencia/sqlite/UsuarioRepositorioSqlite';

const INICIO = new Date('2026-01-01T00:00:00.000Z');
const UNA_HORA_MS = 60 * 60 * 1000;

function nuevaSubasta(id: string, categoriaId = 'coleccionables'): Subasta {
  return Subasta.publicar(
    {
      id,
      vendedorId: 'vendedor-1',
      articulo: Articulo.crear({
        denominacion: 'Moneda antigua',
        descripcion: 'Moneda de 1850',
        estadoConservacion: 'ACEPTABLE',
        categoriaId,
      }),
      precioBase: Dinero.pesos(10000),
      incrementoMinimo: Dinero.pesos(1000),
      fechaCierre: new Date(INICIO.getTime() + 2 * UNA_HORA_MS),
    },
    INICIO,
  );
}

describe('SubastaRepositorioSqlite', () => {
  let bd: ConexionSqlite;
  let repositorio: SubastaRepositorioSqlite;

  beforeEach(async () => {
    bd = abrirBaseDatosSqlite(':memory:');
    repositorio = new SubastaRepositorioSqlite(bd);
    await new UsuarioRepositorioSqlite(bd).guardar(
      Usuario.registrar({ id: 'vendedor-1', nombre: 'Vera', correo: Email.crear('vera@correo.com'), contrasenaCifrada: 'x' }),
    );
  });

  afterEach(() => bd.close());

  test('conserva el agregado completo: pujas, intentos rechazados y orden de pago', async () => {
    const subasta = nuevaSubasta('s-1');
    subasta.registrarPuja('postor-1', Dinero.pesos(10000), INICIO);
    expect(() => subasta.registrarPuja('postor-2', Dinero.pesos(10500), INICIO)).toThrow();
    subasta.registrarPuja('postor-2', Dinero.pesos(11000), INICIO);
    subasta.sincronizar(new Date(INICIO.getTime() + 3 * UNA_HORA_MS));
    await repositorio.guardar(subasta);

    const recuperada = (await repositorio.buscarPorId('s-1'))!;

    expect(recuperada.estadoActual.valor).toBe('ADJUDICADA');
    expect(recuperada.historialPujas.map((p) => [p.idPostor, p.valorOfertado.valor])).toEqual([
      ['postor-1', 10000],
      ['postor-2', 11000],
    ]);
    expect(recuperada.intentosFallidos.map((i) => i.motivo)).toEqual(['RN09_PUJA_INSUFICIENTE']);
    expect(recuperada.ordenDePago?.idGanador).toBe('postor-2');
    expect(recuperada.ordenDePago?.estadoActual).toBe('PENDIENTE');
    expect(recuperada.ordenDePago?.fechaLimite).toEqual(subasta.ordenDePago?.fechaLimite);
  });

  test('las reglas siguen aplicándose sobre una subasta rehidratada', async () => {
    const subasta = nuevaSubasta('s-1');
    subasta.registrarPuja('postor-1', Dinero.pesos(10000), INICIO);
    await repositorio.guardar(subasta);

    const recuperada = (await repositorio.buscarPorId('s-1'))!;

    expect(() => recuperada.registrarPuja('postor-1', Dinero.pesos(20000), INICIO)).toThrow(/mejor postor/);
    expect(() => recuperada.registrarPuja('postor-2', Dinero.pesos(10000), INICIO)).toThrow(/incremento mínimo/);
  });

  test('guardar varias veces no duplica pujas ni la orden de pago', async () => {
    const subasta = nuevaSubasta('s-1');
    subasta.registrarPuja('postor-1', Dinero.pesos(10000), INICIO);
    await repositorio.guardar(subasta);
    await repositorio.guardar(subasta);
    subasta.sincronizar(new Date(INICIO.getTime() + 3 * UNA_HORA_MS));
    await repositorio.guardar(subasta);
    await repositorio.guardar(subasta);

    expect(bd.prepare('SELECT COUNT(*) AS n FROM pujas').get()).toEqual({ n: 1 });
    expect(bd.prepare('SELECT COUNT(*) AS n FROM ordenes_pago').get()).toEqual({ n: 1 });
  });

  test('filtra por categoría y estado, pagina y localiza por orden de pago', async () => {
    await repositorio.guardar(nuevaSubasta('s-1', 'coleccionables'));
    await repositorio.guardar(nuevaSubasta('s-2', 'electronica'));
    const adjudicada = nuevaSubasta('s-3', 'electronica');
    adjudicada.registrarPuja('postor-1', Dinero.pesos(10000), INICIO);
    adjudicada.sincronizar(new Date(INICIO.getTime() + 3 * UNA_HORA_MS));
    await repositorio.guardar(adjudicada);

    const electronica = await repositorio.listar({ categoriaId: 'electronica', pagina: 1, tamanoPagina: 1 });
    expect(electronica.total).toBe(2);
    expect(electronica.subastas).toHaveLength(1);

    const abiertas = await repositorio.listar({ estado: 'ABIERTA', pagina: 1, tamanoPagina: 10 });
    expect(abiertas.subastas.map((s) => s.identificador).sort()).toEqual(['s-1', 's-2']);

    expect((await repositorio.buscarPorOrdenPago('s-3-orden-pago'))?.identificador).toBe('s-3');
    expect((await repositorio.listarGanadasPor('postor-1')).map((s) => s.identificador)).toEqual(['s-3']);
    expect((await repositorio.listarConParticipacionDe('postor-1')).map((s) => s.identificador)).toEqual(['s-3']);
  });

  test('identifica las subastas con el plazo de cierre cumplido', async () => {
    await repositorio.guardar(nuevaSubasta('s-1'));

    expect(await repositorio.listarConPlazoCumplido(INICIO)).toHaveLength(0);
    const vencidas = await repositorio.listarConPlazoCumplido(new Date(INICIO.getTime() + 2 * UNA_HORA_MS));
    expect(vencidas.map((s) => s.identificador)).toEqual(['s-1']);
  });
});

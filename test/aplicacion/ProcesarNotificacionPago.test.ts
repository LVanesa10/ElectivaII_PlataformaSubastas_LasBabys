import { Subasta } from '../../src/dominio/entidades/Subasta';
import { Articulo } from '../../src/dominio/objetos-valor/Articulo';
import { Dinero } from '../../src/dominio/objetos-valor/Dinero';
import { EventoDeDominio } from '../../src/dominio/eventos/EventoDeDominio';
import {
  NotificacionPagoMalFormadaError,
  NotificacionPagoNoVerificableError,
  OrdenPagoNoEncontradaError,
  OrdenPagoNoPendienteError,
} from '../../src/dominio/errores/ErrorDeDominio';
import { ProcesarNotificacionPago } from '../../src/aplicacion/casos-uso/ProcesarNotificacionPago';
import { SubastaRepositorioMemoria } from '../../src/infraestructura/persistencia/memoria/SubastaRepositorioMemoria';
import { EventoPagoRepositorioMemoria } from '../../src/infraestructura/persistencia/memoria/EventoPagoRepositorioMemoria';
import { VerificadorFirmaHmac } from '../../src/infraestructura/servicios/VerificadorFirmaHmac';
import { RelojControlable } from '../apoyo/RelojControlable';

const SECRETO = 'secreto-de-prueba';
const INICIO = new Date('2026-01-01T00:00:00.000Z');
const UNA_HORA_MS = 60 * 60 * 1000;

function notificacionFirmada(contenido: object, secreto = SECRETO) {
  const cuerpoOriginal = JSON.stringify(contenido);
  return { cuerpoOriginal, firma: VerificadorFirmaHmac.firmar(cuerpoOriginal, secreto) };
}

async function prepararEscenario() {
  const reloj = new RelojControlable(INICIO);
  const subastas = new SubastaRepositorioMemoria();
  const eventosPago = new EventoPagoRepositorioMemoria();
  const publicados: EventoDeDominio[] = [];
  const casoDeUso = new ProcesarNotificacionPago(
    new VerificadorFirmaHmac(SECRETO),
    eventosPago,
    subastas,
    reloj,
    { publicar: (evento) => publicados.push(evento) },
  );

  const subasta = Subasta.publicar(
    {
      id: 'subasta-1',
      vendedorId: 'vendedor-1',
      articulo: Articulo.crear({
        denominacion: 'Bicicleta',
        descripcion: 'Bicicleta de ruta',
        estadoConservacion: 'BUEN_ESTADO',
        categoriaId: 'deportes',
      }),
      precioBase: Dinero.pesos(500000),
      incrementoMinimo: Dinero.pesos(50000),
      fechaCierre: new Date(INICIO.getTime() + 2 * UNA_HORA_MS),
    },
    reloj.ahora(),
  );
  subasta.registrarPuja('postor-1', Dinero.pesos(500000), reloj.ahora());
  reloj.adelantar(3 * UNA_HORA_MS);
  subasta.sincronizar(reloj.ahora());
  subasta.extraerEventosPendientes();
  await subastas.guardar(subasta);

  const ordenPagoId = subasta.ordenDePago!.identificador;
  return { reloj, subastas, casoDeUso, publicados, ordenPagoId };
}

describe('ProcesarNotificacionPago (webhook)', () => {
  test('una notificación auténtica y aprobada deja la subasta pagada', async () => {
    const { casoDeUso, subastas, ordenPagoId, publicados } = await prepararEscenario();

    const resultado = await casoDeUso.ejecutar(
      notificacionFirmada({ idEvento: 'evt-1', ordenPagoId, resultado: 'APROBADO' }),
    );

    expect(resultado).toEqual({
      idEvento: 'evt-1',
      ordenPagoId,
      resultado: 'APROBADO',
      estadoOrden: 'CONFIRMADA',
      procesadoPreviamente: false,
    });
    expect((await subastas.buscarPorId('subasta-1'))!.estadoActual.valor).toBe('PAGADA');
    expect(publicados.map((e) => e.tipo)).toEqual(['PAGO_CONFIRMADO']);
  });

  test('RN-18: una firma inválida se rechaza sin cambiar nada', async () => {
    const { casoDeUso, subastas, ordenPagoId, publicados } = await prepararEscenario();

    await expect(
      casoDeUso.ejecutar(notificacionFirmada({ idEvento: 'evt-1', ordenPagoId, resultado: 'APROBADO' }, 'otro')),
    ).rejects.toThrow(NotificacionPagoNoVerificableError);

    expect((await subastas.buscarPorId('subasta-1'))!.estadoActual.valor).toBe('ADJUDICADA');
    expect(publicados).toHaveLength(0);
  });

  test('RN-18: una notificación sin firma se rechaza', async () => {
    const { casoDeUso, ordenPagoId } = await prepararEscenario();
    const cuerpoOriginal = JSON.stringify({ idEvento: 'evt-1', ordenPagoId, resultado: 'APROBADO' });

    await expect(casoDeUso.ejecutar({ cuerpoOriginal, firma: undefined })).rejects.toThrow(
      NotificacionPagoNoVerificableError,
    );
  });

  test('RN-18: alterar el cuerpo después de firmarlo invalida la firma', async () => {
    const { casoDeUso, ordenPagoId } = await prepararEscenario();
    const { firma } = notificacionFirmada({ idEvento: 'evt-1', ordenPagoId, resultado: 'RECHAZADO' });
    const cuerpoAlterado = JSON.stringify({ idEvento: 'evt-1', ordenPagoId, resultado: 'APROBADO' });

    await expect(casoDeUso.ejecutar({ cuerpoOriginal: cuerpoAlterado, firma })).rejects.toThrow(
      NotificacionPagoNoVerificableError,
    );
  });

  test('RN-19: un evento repetido se procesa una sola vez y responde igual', async () => {
    const { casoDeUso, ordenPagoId, publicados } = await prepararEscenario();
    const notificacion = notificacionFirmada({ idEvento: 'evt-1', ordenPagoId, resultado: 'APROBADO' });

    const primera = await casoDeUso.ejecutar(notificacion);
    const segunda = await casoDeUso.ejecutar(notificacion);
    const tercera = await casoDeUso.ejecutar(notificacion);

    expect(segunda).toEqual({ ...primera, procesadoPreviamente: true });
    expect(tercera).toEqual(segunda);
    expect(publicados.filter((e) => e.tipo === 'PAGO_CONFIRMADO')).toHaveLength(1);
  });

  test('un cobro rechazado deja la orden pendiente y permite un nuevo intento', async () => {
    const { casoDeUso, ordenPagoId } = await prepararEscenario();

    const rechazo = await casoDeUso.ejecutar(
      notificacionFirmada({ idEvento: 'evt-1', ordenPagoId, resultado: 'RECHAZADO' }),
    );
    const aprobacion = await casoDeUso.ejecutar(
      notificacionFirmada({ idEvento: 'evt-2', ordenPagoId, resultado: 'APROBADO' }),
    );

    expect(rechazo.estadoOrden).toBe('PENDIENTE');
    expect(aprobacion.estadoOrden).toBe('CONFIRMADA');
  });

  test('RN-20: un pago que llega tras el vencimiento se rechaza y la subasta queda incumplida', async () => {
    const { casoDeUso, subastas, reloj, ordenPagoId } = await prepararEscenario();
    reloj.adelantar(49 * UNA_HORA_MS);

    await expect(
      casoDeUso.ejecutar(notificacionFirmada({ idEvento: 'evt-1', ordenPagoId, resultado: 'APROBADO' })),
    ).rejects.toThrow(OrdenPagoNoPendienteError);

    expect((await subastas.buscarPorId('subasta-1'))!.estadoActual.valor).toBe('INCUMPLIDA');
  });

  test('una orden inexistente se informa como no encontrada', async () => {
    const { casoDeUso } = await prepararEscenario();
    await expect(
      casoDeUso.ejecutar(notificacionFirmada({ idEvento: 'evt-1', ordenPagoId: 'no-existe', resultado: 'APROBADO' })),
    ).rejects.toThrow(OrdenPagoNoEncontradaError);
  });

  test('un cuerpo que no cumple el contrato se rechaza tras verificar la firma', async () => {
    const { casoDeUso, ordenPagoId } = await prepararEscenario();
    await expect(
      casoDeUso.ejecutar(notificacionFirmada({ idEvento: 'evt-1', ordenPagoId, resultado: 'QUIZAS' })),
    ).rejects.toThrow(NotificacionPagoMalFormadaError);
  });
});

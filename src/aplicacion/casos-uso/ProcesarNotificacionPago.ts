import { EventoPago, ResultadoCobro } from '../../dominio/entidades/EventoPago';
import { EstadoOrdenPago } from '../../dominio/entidades/OrdenPago';
import {
  NotificacionPagoMalFormadaError,
  NotificacionPagoNoVerificableError,
  OrdenPagoNoEncontradaError,
} from '../../dominio/errores/ErrorDeDominio';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { EventoPagoRepositorio } from '../puertos/EventoPagoRepositorio';
import { VerificadorOrigenPagos } from '../puertos/VerificadorOrigenPagos';
import { NotificadorDeEventos } from '../puertos/NotificadorDeEventos';
import { Reloj } from '../puertos/Reloj';
import { persistirYAnunciar } from '../servicios/persistirYAnunciar';

// Lo que llega del webhook tal como lo envió la pasarela: el cuerpo sin
// interpretar (la firma se calcula sobre esos bytes exactos) y la firma.
export interface DatosNotificacionPago {
  cuerpoOriginal: string;
  firma: string | undefined;
}

// Contrato del cuerpo que envía la pasarela.
interface ContenidoNotificacionPago {
  idEvento: string;
  ordenPagoId: string;
  resultado: ResultadoCobro;
}

export interface ResultadoProcesamientoPago {
  idEvento: string;
  ordenPagoId: string;
  resultado: ResultadoCobro;
  estadoOrden: EstadoOrdenPago;
  procesadoPreviamente: boolean;
}

// Caso de uso que respalda el webhook de la pasarela. El orden de los pasos
// es parte de las reglas:
//   1. RN-18: verificar el origen antes de cualquier otra cosa, incluso antes
//      de interpretar el cuerpo. Si falla, no se toca nada.
//   2. RN-19: si el evento ya se procesó, responder lo mismo sin reaplicarlo.
//   3. RN-17: solo entonces el agregado registra el resultado del cobro.
export class ProcesarNotificacionPago {
  constructor(
    private readonly verificador: VerificadorOrigenPagos,
    private readonly eventosPago: EventoPagoRepositorio,
    private readonly subastas: SubastaRepositorio,
    private readonly reloj: Reloj,
    private readonly notificador: NotificadorDeEventos,
  ) {}

  async ejecutar(datos: DatosNotificacionPago): Promise<ResultadoProcesamientoPago> {
    if (!this.verificador.esAutentica(datos.cuerpoOriginal, datos.firma)) {
      throw new NotificacionPagoNoVerificableError();
    }

    const contenido = this.interpretar(datos.cuerpoOriginal);

    const yaProcesado = await this.eventosPago.buscarPorIdExterno(contenido.idEvento);
    if (yaProcesado !== null) {
      return this.respuestaPara(yaProcesado, true);
    }

    const subasta = await this.subastas.buscarPorOrdenPago(contenido.ordenPagoId);
    if (subasta === null) {
      throw new OrdenPagoNoEncontradaError();
    }

    const ahora = this.reloj.ahora();
    try {
      subasta.registrarResultadoPago(contenido.ordenPagoId, contenido.resultado, ahora);
    } finally {
      // El vencimiento del plazo pudo evaluarse aunque el cobro se rechace.
      await persistirYAnunciar(subasta, this.subastas, this.notificador);
    }

    const evento = EventoPago.registrar({
      idEventoExterno: contenido.idEvento,
      ordenPagoId: contenido.ordenPagoId,
      resultado: contenido.resultado,
      recibidoEn: ahora,
      estadoOrdenResultante: subasta.ordenDePago!.estadoActual,
    });
    await this.eventosPago.guardar(evento);

    return this.respuestaPara(evento, false);
  }

  private interpretar(cuerpoOriginal: string): ContenidoNotificacionPago {
    let cuerpo: unknown;
    try {
      cuerpo = JSON.parse(cuerpoOriginal);
    } catch {
      throw new NotificacionPagoMalFormadaError('el cuerpo no es JSON válido.');
    }

    const { idEvento, ordenPagoId, resultado } = (cuerpo ?? {}) as Record<string, unknown>;
    if (typeof idEvento !== 'string' || idEvento.trim() === '') {
      throw new NotificacionPagoMalFormadaError('falta "idEvento".');
    }
    if (typeof ordenPagoId !== 'string' || ordenPagoId.trim() === '') {
      throw new NotificacionPagoMalFormadaError('falta "ordenPagoId".');
    }
    if (resultado !== 'APROBADO' && resultado !== 'RECHAZADO') {
      throw new NotificacionPagoMalFormadaError('"resultado" debe ser APROBADO o RECHAZADO.');
    }
    return { idEvento, ordenPagoId, resultado };
  }

  private respuestaPara(evento: EventoPago, procesadoPreviamente: boolean): ResultadoProcesamientoPago {
    return {
      idEvento: evento.idExterno,
      ordenPagoId: evento.idOrdenPago,
      resultado: evento.resultadoCobro,
      estadoOrden: evento.estadoOrdenTrasProcesar,
      procesadoPreviamente,
    };
  }
}

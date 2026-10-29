import { EstadoOrdenPago } from './OrdenPago';

export type ResultadoCobro = 'APROBADO' | 'RECHAZADO';

// Notificación ya verificada que llegó desde la pasarela externa. Se conserva
// junto con el estado en que quedó la orden después de procesarla: así, si la
// pasarela reenvía el mismo evento (RN-19), la plataforma puede responder de
// forma idéntica sin volver a aplicar el cambio.
export class EventoPago {
  private constructor(
    private readonly idEventoExterno: string,
    private readonly ordenPagoId: string,
    private readonly resultado: ResultadoCobro,
    private readonly recibidoEn: Date,
    private readonly estadoOrdenResultante: EstadoOrdenPago,
  ) {}

  static registrar(datos: {
    idEventoExterno: string;
    ordenPagoId: string;
    resultado: ResultadoCobro;
    recibidoEn: Date;
    estadoOrdenResultante: EstadoOrdenPago;
  }): EventoPago {
    return new EventoPago(
      datos.idEventoExterno,
      datos.ordenPagoId,
      datos.resultado,
      datos.recibidoEn,
      datos.estadoOrdenResultante,
    );
  }

  get idExterno(): string {
    return this.idEventoExterno;
  }
  get idOrdenPago(): string {
    return this.ordenPagoId;
  }
  get resultadoCobro(): ResultadoCobro {
    return this.resultado;
  }
  get fechaRecepcion(): Date {
    return new Date(this.recibidoEn.getTime());
  }
  get estadoOrdenTrasProcesar(): EstadoOrdenPago {
    return this.estadoOrdenResultante;
  }
}

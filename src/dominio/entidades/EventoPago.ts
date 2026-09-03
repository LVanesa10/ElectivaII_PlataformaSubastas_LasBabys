// Notificación recibida desde la pasarela externa. La verificación de origen
// y la idempotencia se resolverán en el caso de uso del webhook, en una
// entrega posterior; por ahora solo se modela el concepto.
export class EventoPago {
  private constructor(
    private readonly idEventoExterno: string,
    private readonly ordenPagoId: string,
    private readonly resultado: 'APROBADO' | 'RECHAZADO',
    private readonly recibidoEn: Date,
  ) {}

  static registrar(datos: {
    idEventoExterno: string;
    ordenPagoId: string;
    resultado: 'APROBADO' | 'RECHAZADO';
    recibidoEn: Date;
  }): EventoPago {
    return new EventoPago(datos.idEventoExterno, datos.ordenPagoId, datos.resultado, datos.recibidoEn);
  }

  get idExterno(): string {
    return this.idEventoExterno;
  }
  get idOrdenPago(): string {
    return this.ordenPagoId;
  }
  get resultadoCobro(): 'APROBADO' | 'RECHAZADO' {
    return this.resultado;
  }
  get fechaRecepcion(): Date {
    return new Date(this.recibidoEn.getTime());
  }
}

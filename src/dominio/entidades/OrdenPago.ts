import { Dinero } from '../objetos-valor/Dinero';

export type EstadoOrdenPago = 'PENDIENTE' | 'CONFIRMADA' | 'VENCIDA';

const PLAZO_PAGO_EN_HORAS = 48;

// Se referencia desde la Subasta por id, no se embebe: su confirmación y su
// vencimiento ocurren por eventos externos, aparte del ciclo de la subasta.
// El dominio nunca marca el pago como exitoso por su cuenta; confirmar() solo
// se llama desde el caso de uso que procesa una notificación ya verificada.
export class OrdenPago {
  private estado: EstadoOrdenPago;

  private constructor(
    private readonly id: string,
    private readonly subastaId: string,
    private readonly ganadorId: string,
    private readonly monto: Dinero,
    private readonly fechaGeneracion: Date,
    private readonly venceEn: Date,
  ) {
    this.estado = 'PENDIENTE';
  }

  static generar(datos: {
    id: string;
    subastaId: string;
    ganadorId: string;
    monto: Dinero;
    generadaEn: Date;
  }): OrdenPago {
    const venceEn = new Date(datos.generadaEn.getTime() + PLAZO_PAGO_EN_HORAS * 60 * 60 * 1000);
    return new OrdenPago(datos.id, datos.subastaId, datos.ganadorId, datos.monto, datos.generadaEn, venceEn);
  }

  confirmar(): void {
    if (this.estado !== 'PENDIENTE') {
      return;
    }
    this.estado = 'CONFIRMADA';
  }

  marcarVencidaSi(ahora: Date): void {
    if (this.estado === 'PENDIENTE' && ahora.getTime() > this.venceEn.getTime()) {
      this.estado = 'VENCIDA';
    }
  }

  get identificador(): string {
    return this.id;
  }
  get idSubasta(): string {
    return this.subastaId;
  }
  get idGanador(): string {
    return this.ganadorId;
  }
  get valor(): Dinero {
    return this.monto;
  }
  get fechaLimite(): Date {
    return new Date(this.venceEn.getTime());
  }
  get fechaDeGeneracion(): Date {
    return new Date(this.fechaGeneracion.getTime());
  }
  get estadoActual(): EstadoOrdenPago {
    return this.estado;
  }
}

import { Dinero } from '../objetos-valor/Dinero';
import { OrdenPagoNoPendienteError } from '../errores/ErrorDeDominio';

export type EstadoOrdenPago = 'PENDIENTE' | 'CONFIRMADA' | 'VENCIDA';

const PLAZO_PAGO_EN_HORAS = 48;

// Entidad interna del agregado Subasta: nace con la adjudicación (RN-15) y
// solo cambia a través de la raíz, que es quien decide qué le ocurre a la
// subasta cuando la orden se confirma o vence. El dominio nunca la marca como
// pagada por su cuenta (RN-17): confirmar() solo se alcanza desde
// Subasta.registrarResultadoPago(), invocado por el caso de uso que procesa
// una notificación de la pasarela ya verificada.
export class OrdenPago {
  private constructor(
    private readonly id: string,
    private readonly subastaId: string,
    private readonly ganadorId: string,
    private readonly monto: Dinero,
    private readonly fechaGeneracion: Date,
    private readonly venceEn: Date,
    private estado: EstadoOrdenPago,
  ) {}

  static generar(datos: {
    id: string;
    subastaId: string;
    ganadorId: string;
    monto: Dinero;
    generadaEn: Date;
  }): OrdenPago {
    const venceEn = new Date(datos.generadaEn.getTime() + PLAZO_PAGO_EN_HORAS * 60 * 60 * 1000);
    return new OrdenPago(datos.id, datos.subastaId, datos.ganadorId, datos.monto, datos.generadaEn, venceEn, 'PENDIENTE');
  }

  static reconstruir(datos: {
    id: string;
    subastaId: string;
    ganadorId: string;
    monto: Dinero;
    generadaEn: Date;
    venceEn: Date;
    estado: EstadoOrdenPago;
  }): OrdenPago {
    return new OrdenPago(
      datos.id,
      datos.subastaId,
      datos.ganadorId,
      datos.monto,
      datos.generadaEn,
      datos.venceEn,
      datos.estado,
    );
  }

  estaPendiente(): boolean {
    return this.estado === 'PENDIENTE';
  }

  confirmar(): void {
    if (!this.estaPendiente()) {
      throw new OrdenPagoNoPendienteError(this.estado);
    }
    this.estado = 'CONFIRMADA';
  }

  // RN-20: devuelve true solo en el instante en que la orden pasa a vencida.
  vencerSiCorresponde(ahora: Date): boolean {
    if (this.estaPendiente() && ahora.getTime() > this.venceEn.getTime()) {
      this.estado = 'VENCIDA';
      return true;
    }
    return false;
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

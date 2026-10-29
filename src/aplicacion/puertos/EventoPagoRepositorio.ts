import { EventoPago } from '../../dominio/entidades/EventoPago';

// Registro de las notificaciones de pago ya procesadas. Es la base de la
// idempotencia del webhook (RN-19).
export interface EventoPagoRepositorio {
  guardar(evento: EventoPago): Promise<void>;
  buscarPorIdExterno(idEventoExterno: string): Promise<EventoPago | null>;
}

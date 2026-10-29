import { EventoPago } from '../../../dominio/entidades/EventoPago';
import { EventoPagoRepositorio } from '../../../aplicacion/puertos/EventoPagoRepositorio';

export class EventoPagoRepositorioMemoria implements EventoPagoRepositorio {
  private readonly eventosPorIdExterno = new Map<string, EventoPago>();

  async guardar(evento: EventoPago): Promise<void> {
    this.eventosPorIdExterno.set(evento.idExterno, evento);
  }

  async buscarPorIdExterno(idEventoExterno: string): Promise<EventoPago | null> {
    return this.eventosPorIdExterno.get(idEventoExterno) ?? null;
  }
}

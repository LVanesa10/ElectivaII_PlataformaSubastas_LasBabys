import { EventoDeDominio } from '../../dominio/eventos/EventoDeDominio';
import { NotificadorDeEventos } from '../../aplicacion/puertos/NotificadorDeEventos';

// Reparte cada evento entre varios adaptadores del mismo puerto. El fallo de
// uno no impide que los demás reciban el evento.
export class NotificadorCompuesto implements NotificadorDeEventos {
  constructor(private readonly destinos: NotificadorDeEventos[]) {}

  publicar(evento: EventoDeDominio): void {
    for (const destino of this.destinos) {
      try {
        destino.publicar(evento);
      } catch (error) {
        console.error(`[notificador-fallido] ${destino.constructor.name}`, error);
      }
    }
  }
}

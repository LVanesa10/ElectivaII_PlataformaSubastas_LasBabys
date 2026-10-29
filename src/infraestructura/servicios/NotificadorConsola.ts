import { EventoDeDominio } from '../../dominio/eventos/EventoDeDominio';
import { NotificadorDeEventos } from '../../aplicacion/puertos/NotificadorDeEventos';

// Deja constancia en consola de cada hecho relevante del negocio (RNF-17).
export class NotificadorConsola implements NotificadorDeEventos {
  publicar(evento: EventoDeDominio): void {
    console.log(`[${new Date().toISOString()}] [evento-de-dominio] ${evento.tipo}`, JSON.stringify(evento));
  }
}

import { EventoDeDominio } from '../../dominio/eventos/EventoDeDominio';

// Los casos de uso anuncian por aquí los hechos ya ocurridos. Detrás puede
// haber consola, WebSockets o cualquier otro mecanismo; los casos de uso no
// saben cuál (RNF-05).
export interface NotificadorDeEventos {
  publicar(evento: EventoDeDominio): void;
}

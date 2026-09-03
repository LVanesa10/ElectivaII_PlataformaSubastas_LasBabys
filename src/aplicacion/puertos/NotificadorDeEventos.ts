import { EventoDeDominio } from '../../dominio/eventos/EventoDeDominio';

// Los casos de uso anuncian por aquí los hechos ya ocurridos. Detrás puede
// haber consola, WebSockets o cualquier otro mecanismo.
export interface NotificadorDeEventos {
  publicar(evento: EventoDeDominio): void;
}

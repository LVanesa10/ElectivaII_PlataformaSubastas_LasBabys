import { EventoDeDominio } from '../../dominio/eventos/EventoDeDominio';
import { Notificacion } from '../../dominio/entidades/Notificacion';
import { NotificadorDeEventos } from '../../aplicacion/puertos/NotificadorDeEventos';
import { NotificacionRepositorio } from '../../aplicacion/puertos/NotificacionRepositorio';
import { Reloj } from '../../aplicacion/puertos/Reloj';

// Canal opcional para entregar un aviso en el momento a su destinatario
// (por ejemplo, sus conexiones de WebSocket abiertas).
export interface EntregaInmediataDeAvisos {
  entregar(aviso: Notificacion): void;
}

// Convierte cada hecho en los avisos personales que correspondan —decisión
// que toma el dominio en Notificacion.desdeEvento()—, los persiste para que
// puedan consultarse luego por REST y, si hay un canal en tiempo real, los
// entrega de inmediato a quien esté conectado.
export class NotificadorAvisosPersonales implements NotificadorDeEventos {
  constructor(
    private readonly notificaciones: NotificacionRepositorio,
    private readonly reloj: Reloj,
    private readonly entregaInmediata?: EntregaInmediataDeAvisos,
  ) {}

  publicar(evento: EventoDeDominio): void {
    const avisos = Notificacion.desdeEvento(evento, () => this.notificaciones.siguienteId(), this.reloj.ahora());

    for (const aviso of avisos) {
      // Persistir el aviso es un efecto secundario de mejor esfuerzo: no debe
      // impedir la respuesta del caso de uso que originó el evento.
      this.notificaciones.guardar(aviso).catch((error) => {
        console.error('[notificacion-no-guardada]', error);
      });
      this.entregaInmediata?.entregar(aviso);
    }
  }
}

import { EventoDeDominio } from '../../dominio/eventos/EventoDeDominio';
import { Notificacion } from '../../dominio/entidades/Notificacion';
import { NotificadorDeEventos } from '../../aplicacion/puertos/NotificadorDeEventos';
import { NotificacionRepositorio } from '../../aplicacion/puertos/NotificacionRepositorio';
import { Reloj } from '../../aplicacion/puertos/Reloj';

// Adaptador de esta entrega: registra el hecho en consola y, cuando el
// hecho está dirigido a uno o más usuarios concretos, construye y persiste
// la Notificacion correspondiente a través del puerto de dominio. El futuro
// adaptador de WebSockets implementará el mismo puerto NotificadorDeEventos
// para difundir en tiempo real; ninguno de los dos conoce al otro.
export class NotificadorConsola implements NotificadorDeEventos {
  constructor(
    private readonly notificaciones: NotificacionRepositorio,
    private readonly reloj: Reloj,
  ) {}

  publicar(evento: EventoDeDominio): void {
    console.log(`[evento-de-dominio] ${evento.tipo}`, evento);

    const avisos = Notificacion.desdeEvento(evento, () => this.notificaciones.siguienteId(), this.reloj.ahora());

    for (const aviso of avisos) {
      // Persistir el aviso es un efecto secundario de mejor esfuerzo: no debe
      // impedir ni retrasar la respuesta HTTP que ya se está construyendo en
      // el caso de uso que originó el evento.
      this.notificaciones.guardar(aviso).catch((error) => {
        console.error('[notificacion-no-guardada]', error);
      });
    }
  }
}

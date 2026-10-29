import { EventoDeDominio } from '../../dominio/eventos/EventoDeDominio';
import { Notificacion } from '../../dominio/entidades/Notificacion';
import { NotificadorDeEventos } from '../../aplicacion/puertos/NotificadorDeEventos';
import { EntregaInmediataDeAvisos } from '../servicios/NotificadorAvisosPersonales';
import { presentarNotificacion } from '../http/presentadores';
import { RegistroConexiones } from './RegistroConexiones';
import { crearMensaje, enviar, mensajeDifusionPara } from './mensajes';

// Adaptador de salida del puerto NotificadorDeEventos (RNF-05): los casos de
// uso anuncian un hecho y este adaptador lo traduce a mensajes de WebSocket.
// Nada fuera de la carpeta tiempo-real importa la librería "ws".
export class DifusorWebSocket implements NotificadorDeEventos, EntregaInmediataDeAvisos {
  constructor(private readonly registro: RegistroConexiones) {}

  // Difusión a todos los suscritos de la subasta (RF-13, RF-15).
  publicar(evento: EventoDeDominio): void {
    const mensaje = mensajeDifusionPara(evento);
    if (mensaje === null) {
      return;
    }
    for (const conexion of this.registro.suscritosA(evento.subastaId)) {
      enviar(conexion.socket, mensaje);
    }
  }

  // Aviso personal a todas las conexiones del destinatario (RF-14).
  entregar(aviso: Notificacion): void {
    const mensaje = crearMensaje('AVISO', aviso.idSubasta, presentarNotificacion(aviso));
    for (const conexion of this.registro.conexionesDeUsuario(aviso.idDestinatario)) {
      enviar(conexion.socket, mensaje);
    }
  }

  anunciarParticipantes(subastaId: string): void {
    const mensaje = crearMensaje('PARTICIPANTES_CONECTADOS', subastaId, {
      cantidad: this.registro.cantidadParticipantes(subastaId),
    });
    for (const conexion of this.registro.suscritosA(subastaId)) {
      enviar(conexion.socket, mensaje);
    }
  }
}

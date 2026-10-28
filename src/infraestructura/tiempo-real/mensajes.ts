import WebSocket from 'ws';
import { EventoDeDominio } from '../../dominio/eventos/EventoDeDominio';

// Contrato de los mensajes que el servidor envía por WebSocket. Todos tienen
// la misma forma para que el cliente los despache por "tipo".
export type TipoMensajeServidor =
  | 'CONEXION_ESTABLECIDA'
  | 'SUSCRIPCION_CONFIRMADA'
  | 'SUSCRIPCION_CANCELADA'
  | 'ESTADO_SUBASTA'
  | 'NUEVA_PUJA_VIGENTE'
  | 'SUBASTA_CERRADA'
  | 'ESTADO_SUBASTA_ACTUALIZADO'
  | 'PARTICIPANTES_CONECTADOS'
  | 'AVISO'
  | 'ERROR';

export interface MensajeServidor {
  tipo: TipoMensajeServidor;
  subastaId?: string;
  datos?: unknown;
  fecha: string;
}

export function crearMensaje(tipo: TipoMensajeServidor, subastaId?: string, datos?: unknown): MensajeServidor {
  return { tipo, subastaId, datos, fecha: new Date().toISOString() };
}

export function enviar(socket: WebSocket, mensaje: MensajeServidor): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(mensaje));
  }
}

// Traduce un hecho del negocio al mensaje que se difunde a todos los
// suscritos de la subasta. Los hechos que solo interesan a una persona
// (haber sido superado, un pago rechazado) no se difunden: llegan como AVISO
// a su destinatario.
export function mensajeDifusionPara(evento: EventoDeDominio): MensajeServidor | null {
  switch (evento.tipo) {
    case 'NUEVA_PUJA_VIGENTE':
      return crearMensaje('NUEVA_PUJA_VIGENTE', evento.subastaId, {
        postorId: evento.postorId,
        ofertaVigente: evento.monto,
      });
    case 'SUBASTA_ADJUDICADA':
      return crearMensaje('SUBASTA_CERRADA', evento.subastaId, {
        estado: 'ADJUDICADA',
        ganadorId: evento.ganadorId,
        montoGanador: evento.montoGanador,
      });
    case 'SUBASTA_DESIERTA':
      return crearMensaje('SUBASTA_CERRADA', evento.subastaId, { estado: 'DESIERTA' });
    case 'SUBASTA_CANCELADA':
      return crearMensaje('ESTADO_SUBASTA_ACTUALIZADO', evento.subastaId, { estado: 'CANCELADA' });
    case 'PAGO_CONFIRMADO':
      return crearMensaje('ESTADO_SUBASTA_ACTUALIZADO', evento.subastaId, { estado: 'PAGADA' });
    case 'SUBASTA_INCUMPLIDA':
      return crearMensaje('ESTADO_SUBASTA_ACTUALIZADO', evento.subastaId, { estado: 'INCUMPLIDA' });
    case 'POSTOR_SUPERADO':
    case 'PAGO_RECHAZADO':
      return null;
  }
}

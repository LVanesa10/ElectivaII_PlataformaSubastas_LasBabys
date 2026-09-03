import { EventoDeDominio } from '../eventos/EventoDeDominio';

export type TipoNotificacion =
  | 'PUJA_SUPERADA'
  | 'SUBASTA_ADJUDICADA_GANADOR'
  | 'SUBASTA_ADJUDICADA_VENDEDOR'
  | 'SUBASTA_DESIERTA';

// Aviso dirigido a un usuario concreto sobre un hecho relevante para él.
//
// No debe confundirse con EventoDeDominio: el evento describe lo que le
// ocurrió a la subasta como agregado (y es lo que viaja hacia WebSockets,
// dirigido a todos los suscritos); la notificación describe lo que le
// corresponde saber a un destinatario particular. Por eso un mismo evento
// puede producir cero, una o varias notificaciones — por ejemplo, una
// subasta adjudicada avisa tanto al ganador como al vendedor, cada uno con
// un mensaje distinto, mientras que una nueva puja vigente no genera ningún
// aviso individual porque es información pública de la subasta, no un aviso
// personal.
export class Notificacion {
  private constructor(
    private readonly id: string,
    private readonly destinatarioId: string,
    private readonly tipo: TipoNotificacion,
    private readonly subastaId: string,
    private readonly mensaje: string,
    private readonly generadaEn: Date,
  ) {}

  static generar(datos: {
    id: string;
    destinatarioId: string;
    tipo: TipoNotificacion;
    subastaId: string;
    mensaje: string;
    generadaEn: Date;
  }): Notificacion {
    return new Notificacion(
      datos.id,
      datos.destinatarioId,
      datos.tipo,
      datos.subastaId,
      datos.mensaje,
      datos.generadaEn,
    );
  }

  // A partir de un hecho de negocio ya ocurrido, decide qué avisos concretos
  // corresponden y para quién. El identificador de cada notificación se pide
  // por parámetro (generarId): el dominio decide el contenido y el
  // destinatario, pero no genera identificadores técnicos ni sabe de dónde
  // vienen.
  static desdeEvento(evento: EventoDeDominio, generarId: () => string, ahora: Date): Notificacion[] {
    switch (evento.tipo) {
      case 'POSTOR_SUPERADO':
        return [
          Notificacion.generar({
            id: generarId(),
            destinatarioId: evento.postorSuperadoId,
            tipo: 'PUJA_SUPERADA',
            subastaId: evento.subastaId,
            mensaje: `Tu puja fue superada. La nueva oferta vigente es ${evento.nuevoMonto}.`,
            generadaEn: ahora,
          }),
        ];

      case 'SUBASTA_ADJUDICADA':
        return [
          Notificacion.generar({
            id: generarId(),
            destinatarioId: evento.ganadorId,
            tipo: 'SUBASTA_ADJUDICADA_GANADOR',
            subastaId: evento.subastaId,
            mensaje: `Ganaste la subasta con una oferta de ${evento.montoGanador}. Se generó tu orden de pago.`,
            generadaEn: ahora,
          }),
          Notificacion.generar({
            id: generarId(),
            destinatarioId: evento.vendedorId,
            tipo: 'SUBASTA_ADJUDICADA_VENDEDOR',
            subastaId: evento.subastaId,
            mensaje: `Tu subasta se adjudicó por ${evento.montoGanador}.`,
            generadaEn: ahora,
          }),
        ];

      case 'SUBASTA_DESIERTA':
        return [
          Notificacion.generar({
            id: generarId(),
            destinatarioId: evento.vendedorId,
            tipo: 'SUBASTA_DESIERTA',
            subastaId: evento.subastaId,
            mensaje: 'Tu subasta cerró sin recibir pujas y quedó desierta.',
            generadaEn: ahora,
          }),
        ];

      case 'NUEVA_PUJA_VIGENTE':
        // Difusión general hacia todos los suscritos de la subasta, no un
        // aviso individual: no produce Notificacion.
        return [];
    }
  }

  get identificador(): string {
    return this.id;
  }
  get idDestinatario(): string {
    return this.destinatarioId;
  }
  get tipoNotificacion(): TipoNotificacion {
    return this.tipo;
  }
  get idSubasta(): string {
    return this.subastaId;
  }
  get texto(): string {
    return this.mensaje;
  }
  get fechaGeneracion(): Date {
    return new Date(this.generadaEn.getTime());
  }
}

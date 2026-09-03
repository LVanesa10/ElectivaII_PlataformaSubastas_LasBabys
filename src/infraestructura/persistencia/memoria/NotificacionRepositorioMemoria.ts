import { v4 as uuid } from 'uuid';
import { Notificacion } from '../../../dominio/entidades/Notificacion';
import { NotificacionRepositorio } from '../../../aplicacion/puertos/NotificacionRepositorio';

export class NotificacionRepositorioMemoria implements NotificacionRepositorio {
  private readonly notificaciones: Notificacion[] = [];

  async guardar(notificacion: Notificacion): Promise<void> {
    this.notificaciones.push(notificacion);
  }

  async listarPorDestinatario(destinatarioId: string): Promise<Notificacion[]> {
    return this.notificaciones
      .filter((notificacion) => notificacion.idDestinatario === destinatarioId)
      .sort((a, b) => b.fechaGeneracion.getTime() - a.fechaGeneracion.getTime());
  }

  siguienteId(): string {
    return uuid();
  }
}

import { Notificacion } from '../../dominio/entidades/Notificacion';

export interface NotificacionRepositorio {
  guardar(notificacion: Notificacion): Promise<void>;
  listarPorDestinatario(destinatarioId: string): Promise<Notificacion[]>;
  siguienteId(): string;
}

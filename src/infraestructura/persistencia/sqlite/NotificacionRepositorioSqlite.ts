import { v4 as uuid } from 'uuid';
import { Notificacion, TipoNotificacion } from '../../../dominio/entidades/Notificacion';
import { NotificacionRepositorio } from '../../../aplicacion/puertos/NotificacionRepositorio';
import { ConexionSqlite } from './BaseDatosSqlite';

interface FilaNotificacion {
  id: string;
  destinatario_id: string;
  tipo: string;
  subasta_id: string;
  mensaje: string;
  generada_en: string;
}

export class NotificacionRepositorioSqlite implements NotificacionRepositorio {
  constructor(private readonly bd: ConexionSqlite) {}

  async guardar(notificacion: Notificacion): Promise<void> {
    this.bd
      .prepare(
        `INSERT INTO notificaciones (id, destinatario_id, tipo, subasta_id, mensaje, generada_en)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        notificacion.identificador,
        notificacion.idDestinatario,
        notificacion.tipoNotificacion,
        notificacion.idSubasta,
        notificacion.texto,
        notificacion.fechaGeneracion.toISOString(),
      );
  }

  async listarPorDestinatario(destinatarioId: string): Promise<Notificacion[]> {
    const filas = this.bd
      .prepare('SELECT * FROM notificaciones WHERE destinatario_id = ? ORDER BY generada_en DESC')
      .all(destinatarioId) as FilaNotificacion[];

    return filas.map((fila) =>
      Notificacion.generar({
        id: fila.id,
        destinatarioId: fila.destinatario_id,
        tipo: fila.tipo as TipoNotificacion,
        subastaId: fila.subasta_id,
        mensaje: fila.mensaje,
        generadaEn: new Date(fila.generada_en),
      }),
    );
  }

  siguienteId(): string {
    return uuid();
  }
}

import { EventoPago, ResultadoCobro } from '../../../dominio/entidades/EventoPago';
import { EstadoOrdenPago } from '../../../dominio/entidades/OrdenPago';
import { EventoPagoRepositorio } from '../../../aplicacion/puertos/EventoPagoRepositorio';
import { ConexionSqlite } from './BaseDatosSqlite';

interface FilaEventoPago {
  id_evento_externo: string;
  orden_pago_id: string;
  resultado: string;
  recibido_en: string;
  estado_orden_resultante: string;
}

export class EventoPagoRepositorioSqlite implements EventoPagoRepositorio {
  constructor(private readonly bd: ConexionSqlite) {}

  async guardar(evento: EventoPago): Promise<void> {
    this.bd
      .prepare(
        `INSERT INTO eventos_pago (id_evento_externo, orden_pago_id, resultado, recibido_en, estado_orden_resultante)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        evento.idExterno,
        evento.idOrdenPago,
        evento.resultadoCobro,
        evento.fechaRecepcion.toISOString(),
        evento.estadoOrdenTrasProcesar,
      );
  }

  async buscarPorIdExterno(idEventoExterno: string): Promise<EventoPago | null> {
    const fila = this.bd.prepare('SELECT * FROM eventos_pago WHERE id_evento_externo = ?').get(idEventoExterno) as
      | FilaEventoPago
      | undefined;
    if (fila === undefined) {
      return null;
    }
    return EventoPago.registrar({
      idEventoExterno: fila.id_evento_externo,
      ordenPagoId: fila.orden_pago_id,
      resultado: fila.resultado as ResultadoCobro,
      recibidoEn: new Date(fila.recibido_en),
      estadoOrdenResultante: fila.estado_orden_resultante as EstadoOrdenPago,
    });
  }
}

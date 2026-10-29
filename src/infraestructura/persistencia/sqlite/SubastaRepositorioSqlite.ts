import { v4 as uuid } from 'uuid';
import { Subasta } from '../../../dominio/entidades/Subasta';
import { Puja } from '../../../dominio/entidades/Puja';
import { IntentoPujaRechazado } from '../../../dominio/entidades/IntentoPujaRechazado';
import { EstadoOrdenPago, OrdenPago } from '../../../dominio/entidades/OrdenPago';
import { Articulo, EstadoConservacion } from '../../../dominio/objetos-valor/Articulo';
import { Dinero } from '../../../dominio/objetos-valor/Dinero';
import { EstadoSubasta } from '../../../dominio/objetos-valor/EstadoSubasta';
import { PeriodoSubasta } from '../../../dominio/objetos-valor/PeriodoSubasta';
import {
  FiltrosListadoSubastas,
  ResultadoListadoSubastas,
  SubastaRepositorio,
} from '../../../aplicacion/puertos/SubastaRepositorio';
import { ConexionSqlite } from './BaseDatosSqlite';

interface FilaSubasta {
  id: string;
  vendedor_id: string;
  denominacion: string;
  descripcion: string;
  estado_conservacion: string;
  categoria_id: string;
  precio_base: number;
  incremento_minimo: number;
  fecha_publicacion: string;
  fecha_cierre: string;
  estado: string;
}

interface FilaPuja {
  id: string;
  postor_id: string;
  monto: number;
  registrada_en: string;
}

interface FilaIntento {
  id: string;
  postor_id: string;
  monto_intentado: number;
  codigo_motivo: string;
  ocurrido_en: string;
}

interface FilaOrdenPago {
  id: string;
  subasta_id: string;
  ganador_id: string;
  monto: number;
  generada_en: string;
  vence_en: string;
  estado: string;
}

// Adaptador de salida que guarda el agregado Subasta en SQLite. Cada guardado
// es una transacción que escribe la raíz y sus entidades internas a la vez.
// Las pujas y los intentos rechazados solo se insertan (RN-11: no se
// modifican ni se eliminan); la orden de pago se inserta o actualiza.
export class SubastaRepositorioSqlite implements SubastaRepositorio {
  constructor(private readonly bd: ConexionSqlite) {}

  async guardar(subasta: Subasta): Promise<void> {
    this.guardarEnTransaccion(subasta);
  }

  async buscarPorId(id: string): Promise<Subasta | null> {
    const fila = this.bd.prepare('SELECT * FROM subastas WHERE id = ?').get(id) as FilaSubasta | undefined;
    return fila ? this.rehidratar(fila) : null;
  }

  async buscarPorOrdenPago(ordenPagoId: string): Promise<Subasta | null> {
    const fila = this.bd
      .prepare('SELECT s.* FROM subastas s JOIN ordenes_pago o ON o.subasta_id = s.id WHERE o.id = ?')
      .get(ordenPagoId) as FilaSubasta | undefined;
    return fila ? this.rehidratar(fila) : null;
  }

  async listar(filtros: FiltrosListadoSubastas): Promise<ResultadoListadoSubastas> {
    const condiciones: string[] = [];
    const parametros: Array<string | number> = [];
    if (filtros.categoriaId) {
      condiciones.push('categoria_id = ?');
      parametros.push(filtros.categoriaId);
    }
    if (filtros.estado) {
      condiciones.push('estado = ?');
      parametros.push(filtros.estado);
    }
    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const { total } = this.bd.prepare(`SELECT COUNT(*) AS total FROM subastas ${where}`).get(...parametros) as {
      total: number;
    };
    const filas = this.bd
      .prepare(`SELECT * FROM subastas ${where} ORDER BY fecha_publicacion DESC LIMIT ? OFFSET ?`)
      .all(...parametros, filtros.tamanoPagina, (filtros.pagina - 1) * filtros.tamanoPagina) as FilaSubasta[];

    return { subastas: filas.map((fila) => this.rehidratar(fila)), total };
  }

  async listarPorVendedor(vendedorId: string): Promise<Subasta[]> {
    return this.consultarVarias('SELECT * FROM subastas WHERE vendedor_id = ? ORDER BY fecha_publicacion DESC', vendedorId);
  }

  async listarConParticipacionDe(usuarioId: string): Promise<Subasta[]> {
    return this.consultarVarias(
      `SELECT * FROM subastas
       WHERE id IN (SELECT subasta_id FROM pujas WHERE postor_id = ?)
       ORDER BY fecha_publicacion DESC`,
      usuarioId,
    );
  }

  async listarGanadasPor(usuarioId: string): Promise<Subasta[]> {
    return this.consultarVarias(
      `SELECT s.* FROM subastas s JOIN ordenes_pago o ON o.subasta_id = s.id
       WHERE o.ganador_id = ? ORDER BY o.generada_en DESC`,
      usuarioId,
    );
  }

  async listarConPlazoCumplido(ahora: Date): Promise<Subasta[]> {
    const momento = ahora.toISOString();
    return this.consultarVarias(
      `SELECT s.* FROM subastas s LEFT JOIN ordenes_pago o ON o.subasta_id = s.id
       WHERE (s.estado = 'ABIERTA' AND s.fecha_cierre <= ?)
          OR (s.estado = 'ADJUDICADA' AND o.estado = 'PENDIENTE' AND o.vence_en < ?)`,
      momento,
      momento,
    );
  }

  siguienteId(): string {
    return uuid();
  }

  private consultarVarias(sql: string, ...parametros: string[]): Subasta[] {
    const filas = this.bd.prepare(sql).all(...parametros) as FilaSubasta[];
    return filas.map((fila) => this.rehidratar(fila));
  }

  private guardarEnTransaccion(subasta: Subasta): void {
    this.bd.transaction(() => {
      this.bd
        .prepare(
          `INSERT INTO subastas (id, vendedor_id, denominacion, descripcion, estado_conservacion, categoria_id,
                                 precio_base, incremento_minimo, fecha_publicacion, fecha_cierre, estado)
           VALUES (@id, @vendedorId, @denominacion, @descripcion, @estadoConservacion, @categoriaId,
                   @precioBase, @incrementoMinimo, @fechaPublicacion, @fechaCierre, @estado)
           ON CONFLICT (id) DO UPDATE SET estado = excluded.estado`,
        )
        .run({
          id: subasta.identificador,
          vendedorId: subasta.idVendedor,
          denominacion: subasta.datosArticulo.nombreDenominacion,
          descripcion: subasta.datosArticulo.textoDescripcion,
          estadoConservacion: subasta.datosArticulo.estado,
          categoriaId: subasta.datosArticulo.idCategoria,
          precioBase: subasta.valorPrecioBase.valor,
          incrementoMinimo: subasta.valorIncrementoMinimo.valor,
          fechaPublicacion: subasta.fechaDePublicacion.toISOString(),
          fechaCierre: subasta.fechaDeCierre.toISOString(),
          estado: subasta.estadoActual.valor,
        });

      const insertarPuja = this.bd.prepare(
        `INSERT OR IGNORE INTO pujas (id, subasta_id, secuencia, postor_id, monto, registrada_en)
         VALUES (?, ?, ?, ?, ?, ?)`,
      );
      subasta.historialPujas.forEach((puja, indice) => {
        insertarPuja.run(
          puja.identificador,
          subasta.identificador,
          indice + 1,
          puja.idPostor,
          puja.valorOfertado.valor,
          puja.fechaRegistro.toISOString(),
        );
      });

      const insertarIntento = this.bd.prepare(
        `INSERT OR IGNORE INTO intentos_puja_rechazados
           (id, subasta_id, secuencia, postor_id, monto_intentado, codigo_motivo, ocurrido_en)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      subasta.intentosFallidos.forEach((intento, indice) => {
        insertarIntento.run(
          intento.identificador,
          subasta.identificador,
          indice + 1,
          intento.idPostor,
          intento.monto.valor,
          intento.motivo,
          intento.fecha.toISOString(),
        );
      });

      const orden = subasta.ordenDePago;
      if (orden !== undefined) {
        this.bd
          .prepare(
            `INSERT INTO ordenes_pago (id, subasta_id, ganador_id, monto, generada_en, vence_en, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (id) DO UPDATE SET estado = excluded.estado`,
          )
          .run(
            orden.identificador,
            subasta.identificador,
            orden.idGanador,
            orden.valor.valor,
            orden.fechaDeGeneracion.toISOString(),
            orden.fechaLimite.toISOString(),
            orden.estadoActual,
          );
      }
    })();
  }

  private rehidratar(fila: FilaSubasta): Subasta {
    const pujas = (
      this.bd
        .prepare('SELECT id, postor_id, monto, registrada_en FROM pujas WHERE subasta_id = ? ORDER BY secuencia')
        .all(fila.id) as FilaPuja[]
    ).map((p) => Puja.registrar(p.id, p.postor_id, Dinero.pesos(p.monto), new Date(p.registrada_en)));

    const intentos = (
      this.bd
        .prepare(
          `SELECT id, postor_id, monto_intentado, codigo_motivo, ocurrido_en
           FROM intentos_puja_rechazados WHERE subasta_id = ? ORDER BY secuencia`,
        )
        .all(fila.id) as FilaIntento[]
    ).map((i) =>
      IntentoPujaRechazado.registrar({
        id: i.id,
        postorId: i.postor_id,
        montoIntentado: Dinero.pesos(i.monto_intentado),
        codigoMotivo: i.codigo_motivo,
        ocurridoEn: new Date(i.ocurrido_en),
      }),
    );

    const filaOrden = this.bd.prepare('SELECT * FROM ordenes_pago WHERE subasta_id = ?').get(fila.id) as
      | FilaOrdenPago
      | undefined;
    const ordenPago = filaOrden
      ? OrdenPago.reconstruir({
          id: filaOrden.id,
          subastaId: filaOrden.subasta_id,
          ganadorId: filaOrden.ganador_id,
          monto: Dinero.pesos(filaOrden.monto),
          generadaEn: new Date(filaOrden.generada_en),
          venceEn: new Date(filaOrden.vence_en),
          estado: filaOrden.estado as EstadoOrdenPago,
        })
      : undefined;

    return Subasta.reconstruir({
      id: fila.id,
      vendedorId: fila.vendedor_id,
      articulo: Articulo.crear({
        denominacion: fila.denominacion,
        descripcion: fila.descripcion,
        estadoConservacion: fila.estado_conservacion as EstadoConservacion,
        categoriaId: fila.categoria_id,
      }),
      precioBase: Dinero.pesos(fila.precio_base),
      incrementoMinimo: Dinero.pesos(fila.incremento_minimo),
      periodo: PeriodoSubasta.crear(new Date(fila.fecha_publicacion), new Date(fila.fecha_cierre)),
      estado: EstadoSubasta.desdeNombre(fila.estado),
      pujas,
      intentosRechazados: intentos,
      ordenPago,
    });
  }
}

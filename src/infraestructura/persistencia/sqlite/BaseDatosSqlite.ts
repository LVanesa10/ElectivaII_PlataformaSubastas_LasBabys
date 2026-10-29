import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { CATEGORIAS_SEMILLA } from '../categoriasSemilla';

export type ConexionSqlite = Database.Database;

// Esquema relacional del modelo. Las pujas, los intentos rechazados y la orden
// de pago se guardan en tablas propias, pero siempre se leen y escriben como
// parte de su subasta: el repositorio respeta la frontera del agregado.
const ESQUEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id                 TEXT PRIMARY KEY,
  nombre             TEXT NOT NULL,
  correo             TEXT NOT NULL UNIQUE,
  contrasena_cifrada TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias (
  id     TEXT PRIMARY KEY,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subastas (
  id                  TEXT PRIMARY KEY,
  vendedor_id         TEXT NOT NULL REFERENCES usuarios(id),
  denominacion        TEXT NOT NULL,
  descripcion         TEXT NOT NULL,
  estado_conservacion TEXT NOT NULL,
  categoria_id        TEXT NOT NULL REFERENCES categorias(id),
  precio_base         INTEGER NOT NULL CHECK (precio_base > 0),
  incremento_minimo   INTEGER NOT NULL CHECK (incremento_minimo > 0),
  fecha_publicacion   TEXT NOT NULL,
  fecha_cierre        TEXT NOT NULL,
  estado              TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subastas_estado ON subastas(estado);
CREATE INDEX IF NOT EXISTS idx_subastas_categoria ON subastas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_subastas_vendedor ON subastas(vendedor_id);

CREATE TABLE IF NOT EXISTS pujas (
  id          TEXT PRIMARY KEY,
  subasta_id  TEXT NOT NULL REFERENCES subastas(id),
  secuencia   INTEGER NOT NULL,
  postor_id   TEXT NOT NULL,
  monto       INTEGER NOT NULL CHECK (monto >= 0),
  registrada_en TEXT NOT NULL,
  UNIQUE (subasta_id, secuencia)
);
CREATE INDEX IF NOT EXISTS idx_pujas_postor ON pujas(postor_id);

CREATE TABLE IF NOT EXISTS intentos_puja_rechazados (
  id             TEXT PRIMARY KEY,
  subasta_id     TEXT NOT NULL REFERENCES subastas(id),
  secuencia      INTEGER NOT NULL,
  postor_id      TEXT NOT NULL,
  monto_intentado INTEGER NOT NULL,
  codigo_motivo  TEXT NOT NULL,
  ocurrido_en    TEXT NOT NULL,
  UNIQUE (subasta_id, secuencia)
);

CREATE TABLE IF NOT EXISTS ordenes_pago (
  id          TEXT PRIMARY KEY,
  subasta_id  TEXT NOT NULL UNIQUE REFERENCES subastas(id),
  ganador_id  TEXT NOT NULL,
  monto       INTEGER NOT NULL,
  generada_en TEXT NOT NULL,
  vence_en    TEXT NOT NULL,
  estado      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ordenes_ganador ON ordenes_pago(ganador_id);

CREATE TABLE IF NOT EXISTS eventos_pago (
  id_evento_externo       TEXT PRIMARY KEY,
  orden_pago_id           TEXT NOT NULL REFERENCES ordenes_pago(id),
  resultado               TEXT NOT NULL,
  recibido_en             TEXT NOT NULL,
  estado_orden_resultante TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id              TEXT PRIMARY KEY,
  destinatario_id TEXT NOT NULL,
  tipo            TEXT NOT NULL,
  subasta_id      TEXT NOT NULL,
  mensaje         TEXT NOT NULL,
  generada_en     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario ON notificaciones(destinatario_id);
`;

// Abre (o crea) la base de datos, aplica el esquema y siembra las categorías.
// Con ":memory:" se obtiene una base efímera, útil para las pruebas.
export function abrirBaseDatosSqlite(ruta: string): ConexionSqlite {
  if (ruta !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(ruta)), { recursive: true });
  }

  const conexion = new Database(ruta);
  conexion.pragma('journal_mode = WAL');
  conexion.pragma('foreign_keys = ON');
  conexion.exec(ESQUEMA);

  const sembrar = conexion.prepare('INSERT OR IGNORE INTO categorias (id, nombre) VALUES (?, ?)');
  for (const [id, nombre] of CATEGORIAS_SEMILLA) {
    sembrar.run(id, nombre);
  }

  return conexion;
}

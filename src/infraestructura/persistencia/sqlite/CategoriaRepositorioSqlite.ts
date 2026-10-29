import { Categoria } from '../../../dominio/entidades/Categoria';
import { CategoriaRepositorio } from '../../../aplicacion/puertos/CategoriaRepositorio';
import { ConexionSqlite } from './BaseDatosSqlite';

interface FilaCategoria {
  id: string;
  nombre: string;
}

export class CategoriaRepositorioSqlite implements CategoriaRepositorio {
  constructor(private readonly bd: ConexionSqlite) {}

  async guardar(categoria: Categoria): Promise<void> {
    this.bd
      .prepare('INSERT INTO categorias (id, nombre) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre')
      .run(categoria.identificador, categoria.nombreCategoria);
  }

  async buscarPorId(id: string): Promise<Categoria | null> {
    const fila = this.bd.prepare('SELECT id, nombre FROM categorias WHERE id = ?').get(id) as FilaCategoria | undefined;
    return fila ? Categoria.crear(fila.id, fila.nombre) : null;
  }

  async listarTodas(): Promise<Categoria[]> {
    const filas = this.bd.prepare('SELECT id, nombre FROM categorias ORDER BY nombre').all() as FilaCategoria[];
    return filas.map((fila) => Categoria.crear(fila.id, fila.nombre));
  }
}

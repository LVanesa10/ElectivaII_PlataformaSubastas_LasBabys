import { Categoria } from '../../../dominio/entidades/Categoria';
import { CategoriaRepositorio } from '../../../aplicacion/puertos/CategoriaRepositorio';
import { CATEGORIAS_SEMILLA } from '../categoriasSemilla';

export class CategoriaRepositorioMemoria implements CategoriaRepositorio {
  private readonly categoriasPorId = new Map<string, Categoria>();

  constructor() {
    for (const [id, nombre] of CATEGORIAS_SEMILLA) {
      this.categoriasPorId.set(id, Categoria.crear(id, nombre));
    }
  }

  async guardar(categoria: Categoria): Promise<void> {
    this.categoriasPorId.set(categoria.identificador, categoria);
  }

  async buscarPorId(id: string): Promise<Categoria | null> {
    return this.categoriasPorId.get(id) ?? null;
  }

  async listarTodas(): Promise<Categoria[]> {
    return [...this.categoriasPorId.values()];
  }
}

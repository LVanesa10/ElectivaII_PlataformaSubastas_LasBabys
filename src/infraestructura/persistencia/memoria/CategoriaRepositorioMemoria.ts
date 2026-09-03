import { Categoria } from '../../../dominio/entidades/Categoria';
import { CategoriaRepositorio } from '../../../aplicacion/puertos/CategoriaRepositorio';

const CATEGORIAS_SEMILLA: Array<[string, string]> = [
  ['electronica', 'Electrónica'],
  ['hogar', 'Hogar y muebles'],
  ['coleccionables', 'Coleccionables y arte'],
  ['vehiculos', 'Vehículos y repuestos'],
  ['deportes', 'Deportes y aire libre'],
];

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

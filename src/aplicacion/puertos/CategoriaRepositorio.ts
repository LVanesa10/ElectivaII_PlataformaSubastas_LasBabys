import { Categoria } from '../../dominio/entidades/Categoria';

export interface CategoriaRepositorio {
  guardar(categoria: Categoria): Promise<void>;
  buscarPorId(id: string): Promise<Categoria | null>;
  listarTodas(): Promise<Categoria[]>;
}

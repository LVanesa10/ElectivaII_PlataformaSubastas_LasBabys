import { Subasta } from '../../dominio/entidades/Subasta';

export interface FiltrosListadoSubastas {
  categoriaId?: string;
  estado?: string;
  pagina: number;
  tamanoPagina: number;
}

export interface ResultadoListadoSubastas {
  subastas: Subasta[];
  total: number;
}

export interface SubastaRepositorio {
  guardar(subasta: Subasta): Promise<void>;
  buscarPorId(id: string): Promise<Subasta | null>;
  listar(filtros: FiltrosListadoSubastas): Promise<ResultadoListadoSubastas>;
  listarPorVendedor(vendedorId: string): Promise<Subasta[]>;
  listarConParticipacionDe(usuarioId: string): Promise<Subasta[]>;
  siguienteId(): string;
}

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
  buscarPorOrdenPago(ordenPagoId: string): Promise<Subasta | null>;
  listar(filtros: FiltrosListadoSubastas): Promise<ResultadoListadoSubastas>;
  listarPorVendedor(vendedorId: string): Promise<Subasta[]>;
  listarConParticipacionDe(usuarioId: string): Promise<Subasta[]>;
  listarGanadasPor(usuarioId: string): Promise<Subasta[]>;
  // Subastas cuyo estado guardado ya no corresponde con el momento actual:
  // abiertas con la fecha de cierre cumplida o adjudicadas con la orden de
  // pago pendiente y vencida. Permite aplicar el cierre perezoso antes de
  // filtrar un listado por estado.
  listarConPlazoCumplido(ahora: Date): Promise<Subasta[]>;
  siguienteId(): string;
}

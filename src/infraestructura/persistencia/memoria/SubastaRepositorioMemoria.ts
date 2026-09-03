import { v4 as uuid } from 'uuid';
import { Subasta } from '../../../dominio/entidades/Subasta';
import {
  FiltrosListadoSubastas,
  ResultadoListadoSubastas,
  SubastaRepositorio,
} from '../../../aplicacion/puertos/SubastaRepositorio';

// Implementación en memoria del puerto. La consistencia de las pujas la
// garantiza el agregado Subasta, no este repositorio.
export class SubastaRepositorioMemoria implements SubastaRepositorio {
  private readonly subastasPorId = new Map<string, Subasta>();

  async guardar(subasta: Subasta): Promise<void> {
    this.subastasPorId.set(subasta.identificador, subasta);
  }

  async buscarPorId(id: string): Promise<Subasta | null> {
    return this.subastasPorId.get(id) ?? null;
  }

  async listar(filtros: FiltrosListadoSubastas): Promise<ResultadoListadoSubastas> {
    let subastas = [...this.subastasPorId.values()];

    if (filtros.categoriaId) {
      subastas = subastas.filter((s) => s.datosArticulo.idCategoria === filtros.categoriaId);
    }
    if (filtros.estado) {
      subastas = subastas.filter((s) => s.estadoActual.valor === filtros.estado);
    }

    subastas.sort((a, b) => b.fechaDePublicacion.getTime() - a.fechaDePublicacion.getTime());

    const total = subastas.length;
    const inicio = (filtros.pagina - 1) * filtros.tamanoPagina;
    const pagina = subastas.slice(inicio, inicio + filtros.tamanoPagina);

    return { subastas: pagina, total };
  }

  async listarPorVendedor(vendedorId: string): Promise<Subasta[]> {
    return [...this.subastasPorId.values()].filter((s) => s.idVendedor === vendedorId);
  }

  async listarConParticipacionDe(usuarioId: string): Promise<Subasta[]> {
    return [...this.subastasPorId.values()].filter((s) =>
      s.historialPujas.some((p) => p.idPostor === usuarioId),
    );
  }

  siguienteId(): string {
    return uuid();
  }
}

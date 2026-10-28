import { Subasta } from '../../dominio/entidades/Subasta';
import { OrdenPago } from '../../dominio/entidades/OrdenPago';
import { NoAutorizadoError, OrdenPagoNoEncontradaError } from '../../dominio/errores/ErrorDeDominio';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { Reloj } from '../puertos/Reloj';
import { NotificadorDeEventos } from '../puertos/NotificadorDeEventos';
import { persistirYAnunciar } from '../servicios/persistirYAnunciar';

export interface OrdenPagoConSubasta {
  orden: OrdenPago;
  subasta: Subasta;
}

// RF-17: el ganador consulta sus órdenes de pago. El vendedor también puede
// ver la orden de su propia subasta; nadie más.
export class ConsultarOrdenesPago {
  constructor(
    private readonly subastas: SubastaRepositorio,
    private readonly reloj: Reloj,
    private readonly notificador: NotificadorDeEventos,
  ) {}

  async listarDelGanador(usuarioId: string): Promise<OrdenPagoConSubasta[]> {
    const ganadas = await this.subastas.listarGanadasPor(usuarioId);
    const resultado: OrdenPagoConSubasta[] = [];
    for (const subasta of ganadas) {
      await this.sincronizar(subasta);
      resultado.push({ orden: subasta.ordenDePago!, subasta });
    }
    return resultado;
  }

  async consultar(ordenPagoId: string, usuarioId: string): Promise<OrdenPagoConSubasta> {
    const subasta = await this.subastas.buscarPorOrdenPago(ordenPagoId);
    const orden = subasta?.ordenDePago;
    if (subasta === null || orden === undefined) {
      throw new OrdenPagoNoEncontradaError();
    }
    if (orden.idGanador !== usuarioId && subasta.idVendedor !== usuarioId) {
      throw new NoAutorizadoError('Solo el ganador o el vendedor pueden consultar esta orden de pago.');
    }

    await this.sincronizar(subasta);
    return { orden, subasta };
  }

  // El vencimiento de la orden (RN-20) también se evalúa de forma perezosa.
  private async sincronizar(subasta: Subasta): Promise<void> {
    subasta.sincronizar(this.reloj.ahora());
    await persistirYAnunciar(subasta, this.subastas, this.notificador);
  }
}

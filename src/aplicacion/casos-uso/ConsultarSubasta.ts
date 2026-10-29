import { Subasta } from '../../dominio/entidades/Subasta';
import { SubastaNoEncontradaError } from '../../dominio/errores/ErrorDeDominio';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { Reloj } from '../puertos/Reloj';
import { NotificadorDeEventos } from '../puertos/NotificadorDeEventos';
import { persistirYAnunciar } from '../servicios/persistirYAnunciar';

export class ConsultarSubasta {
  constructor(
    private readonly subastas: SubastaRepositorio,
    private readonly reloj: Reloj,
    private readonly notificador: NotificadorDeEventos,
  ) {}

  async ejecutar(subastaId: string): Promise<Subasta> {
    const subasta = await this.subastas.buscarPorId(subastaId);
    if (subasta === null) {
      throw new SubastaNoEncontradaError();
    }

    // Cada consulta reevalúa si la fecha de cierre o el plazo de pago ya pasaron.
    subasta.sincronizar(this.reloj.ahora());

    await persistirYAnunciar(subasta, this.subastas, this.notificador);
    return subasta;
  }
}

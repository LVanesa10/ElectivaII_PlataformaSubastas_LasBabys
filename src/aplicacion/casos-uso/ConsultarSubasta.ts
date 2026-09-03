import { Subasta } from '../../dominio/entidades/Subasta';
import { SubastaNoEncontradaError } from '../../dominio/errores/ErrorDeDominio';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { Reloj } from '../puertos/Reloj';
import { NotificadorDeEventos } from '../puertos/NotificadorDeEventos';

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

    // Cada consulta reevalúa si la fecha de cierre ya pasó.
    subasta.sincronizarCierre(this.reloj.ahora());

    for (const evento of subasta.extraerEventosPendientes()) {
      this.notificador.publicar(evento);
    }

    await this.subastas.guardar(subasta);
    return subasta;
  }
}

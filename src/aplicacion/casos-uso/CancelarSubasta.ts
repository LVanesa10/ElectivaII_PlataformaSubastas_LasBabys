import { SubastaNoEncontradaError } from '../../dominio/errores/ErrorDeDominio';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { Reloj } from '../puertos/Reloj';
import { NotificadorDeEventos } from '../puertos/NotificadorDeEventos';
import { persistirYAnunciar } from '../servicios/persistirYAnunciar';

export class CancelarSubasta {
  constructor(
    private readonly subastas: SubastaRepositorio,
    private readonly reloj: Reloj,
    private readonly notificador: NotificadorDeEventos,
  ) {}

  async ejecutar(subastaId: string, vendedorId: string): Promise<void> {
    const subasta = await this.subastas.buscarPorId(subastaId);
    if (subasta === null) {
      throw new SubastaNoEncontradaError();
    }

    try {
      subasta.cancelar(vendedorId, this.reloj.ahora());
    } finally {
      // Aunque la cancelación se rechace, el cierre perezoso pudo haber
      // cambiado el estado y debe quedar guardado y anunciado.
      await persistirYAnunciar(subasta, this.subastas, this.notificador);
    }
  }
}

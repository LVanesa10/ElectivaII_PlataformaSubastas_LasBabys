import { SubastaNoEncontradaError } from '../../dominio/errores/ErrorDeDominio';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { Reloj } from '../puertos/Reloj';

export class CancelarSubasta {
  constructor(
    private readonly subastas: SubastaRepositorio,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(subastaId: string, vendedorId: string): Promise<void> {
    const subasta = await this.subastas.buscarPorId(subastaId);
    if (subasta === null) {
      throw new SubastaNoEncontradaError();
    }

    subasta.cancelar(vendedorId, this.reloj.ahora());

    await this.subastas.guardar(subasta);
  }
}

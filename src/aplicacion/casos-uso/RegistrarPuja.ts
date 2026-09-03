import { Puja } from '../../dominio/entidades/Puja';
import { Dinero } from '../../dominio/objetos-valor/Dinero';
import { SubastaNoEncontradaError } from '../../dominio/errores/ErrorDeDominio';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { Reloj } from '../puertos/Reloj';
import { NotificadorDeEventos } from '../puertos/NotificadorDeEventos';

export interface DatosRegistrarPuja {
  subastaId: string;
  postorId: string;
  monto: number;
}

export class RegistrarPuja {
  constructor(
    private readonly subastas: SubastaRepositorio,
    private readonly reloj: Reloj,
    private readonly notificador: NotificadorDeEventos,
  ) {}

  async ejecutar(datos: DatosRegistrarPuja): Promise<Puja> {
    const subasta = await this.subastas.buscarPorId(datos.subastaId);
    if (subasta === null) {
      throw new SubastaNoEncontradaError();
    }

    try {
      return subasta.registrarPuja(datos.postorId, Dinero.pesos(datos.monto), this.reloj.ahora());
    } finally {
      // Se difunde y se persiste tanto si la puja se aceptó como si se
      // rechazó: el intento fallido también debe quedar guardado.
      for (const evento of subasta.extraerEventosPendientes()) {
        this.notificador.publicar(evento);
      }
      await this.subastas.guardar(subasta);
    }
  }
}

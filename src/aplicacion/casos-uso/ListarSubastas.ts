import { EstadoSubasta } from '../../dominio/objetos-valor/EstadoSubasta';
import { ResultadoListadoSubastas, SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { Reloj } from '../puertos/Reloj';
import { NotificadorDeEventos } from '../puertos/NotificadorDeEventos';
import { persistirYAnunciar } from '../servicios/persistirYAnunciar';

export interface DatosListarSubastas {
  categoriaId?: string;
  estado?: string;
  pagina?: number;
  tamanoPagina?: number;
}

export class ListarSubastas {
  constructor(
    private readonly subastas: SubastaRepositorio,
    private readonly reloj: Reloj,
    private readonly notificador: NotificadorDeEventos,
  ) {}

  async ejecutar(datos: DatosListarSubastas): Promise<ResultadoListadoSubastas> {
    const estado = datos.estado !== undefined ? EstadoSubasta.desdeNombre(datos.estado).valor : undefined;

    // El cierre perezoso se aplica antes de filtrar: de lo contrario una
    // subasta vencida seguiría apareciendo en el filtro de abiertas.
    const ahora = this.reloj.ahora();
    for (const subasta of await this.subastas.listarConPlazoCumplido(ahora)) {
      subasta.sincronizar(ahora);
      await persistirYAnunciar(subasta, this.subastas, this.notificador);
    }

    return this.subastas.listar({
      categoriaId: datos.categoriaId,
      estado,
      pagina: datos.pagina ?? 1,
      tamanoPagina: datos.tamanoPagina ?? 10,
    });
  }
}

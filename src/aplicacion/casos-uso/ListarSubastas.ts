import { ResultadoListadoSubastas, SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { Reloj } from '../puertos/Reloj';

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
  ) {}

  async ejecutar(datos: DatosListarSubastas): Promise<ResultadoListadoSubastas> {
    const resultado = await this.subastas.listar({
      categoriaId: datos.categoriaId,
      estado: datos.estado,
      pagina: datos.pagina ?? 1,
      tamanoPagina: datos.tamanoPagina ?? 10,
    });

    // El cierre perezoso también se evalúa al listar.
    const ahora = this.reloj.ahora();
    for (const subasta of resultado.subastas) {
      subasta.sincronizarCierre(ahora);
      await this.subastas.guardar(subasta);
    }

    return resultado;
  }
}

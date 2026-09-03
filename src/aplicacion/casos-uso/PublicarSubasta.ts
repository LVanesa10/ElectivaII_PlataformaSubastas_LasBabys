import { Subasta } from '../../dominio/entidades/Subasta';
import { Articulo, EstadoConservacion } from '../../dominio/objetos-valor/Articulo';
import { Dinero } from '../../dominio/objetos-valor/Dinero';
import { UsuarioNoEncontradoError, CategoriaNoEncontradaError } from '../../dominio/errores/ErrorDeDominio';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { UsuarioRepositorio } from '../puertos/UsuarioRepositorio';
import { CategoriaRepositorio } from '../puertos/CategoriaRepositorio';
import { Reloj } from '../puertos/Reloj';

export interface DatosPublicarSubasta {
  vendedorId: string;
  denominacion: string;
  descripcion: string;
  estadoConservacion: EstadoConservacion;
  categoriaId: string;
  precioBase: number;
  incrementoMinimo: number;
  fechaCierre: Date;
}

export class PublicarSubasta {
  constructor(
    private readonly subastas: SubastaRepositorio,
    private readonly usuarios: UsuarioRepositorio,
    private readonly categorias: CategoriaRepositorio,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(datos: DatosPublicarSubasta): Promise<Subasta> {
    const vendedor = await this.usuarios.buscarPorId(datos.vendedorId);
    if (vendedor === null) {
      throw new UsuarioNoEncontradoError();
    }

    const categoria = await this.categorias.buscarPorId(datos.categoriaId);
    if (categoria === null) {
      throw new CategoriaNoEncontradaError();
    }

    const articulo = Articulo.crear({
      denominacion: datos.denominacion,
      descripcion: datos.descripcion,
      estadoConservacion: datos.estadoConservacion,
      categoriaId: datos.categoriaId,
    });

    const subasta = Subasta.publicar(
      {
        id: this.subastas.siguienteId(),
        vendedorId: datos.vendedorId,
        articulo,
        precioBase: Dinero.pesos(datos.precioBase),
        incrementoMinimo: Dinero.pesos(datos.incrementoMinimo),
        fechaCierre: datos.fechaCierre,
      },
      this.reloj.ahora(),
    );

    await this.subastas.guardar(subasta);
    return subasta;
  }
}

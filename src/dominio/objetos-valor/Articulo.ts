import { DatosArticuloInvalidosError } from '../errores/ErrorDeDominio';

export type EstadoConservacion = 'NUEVO' | 'COMO_NUEVO' | 'BUEN_ESTADO' | 'ACEPTABLE' | 'PARA_REPARAR';

// El artículo va embebido en la Subasta: no se consulta ni se referencia por
// separado, y dos artículos con los mismos datos son equivalentes.
export class Articulo {
  private constructor(
    private readonly denominacion: string,
    private readonly descripcion: string,
    private readonly estadoConservacion: EstadoConservacion,
    private readonly categoriaId: string,
  ) {}

  static crear(datos: {
    denominacion: string;
    descripcion: string;
    estadoConservacion: EstadoConservacion;
    categoriaId: string;
  }): Articulo {
    const denominacion = datos.denominacion.trim();
    const descripcion = datos.descripcion.trim();

    if (denominacion.length === 0) {
      throw new DatosArticuloInvalidosError('La denominación del artículo no puede estar vacía.');
    }
    if (descripcion.length === 0) {
      throw new DatosArticuloInvalidosError('La descripción del artículo no puede estar vacía.');
    }
    if (datos.categoriaId.trim().length === 0) {
      throw new DatosArticuloInvalidosError('El artículo debe pertenecer a una categoría.');
    }

    return new Articulo(denominacion, descripcion, datos.estadoConservacion, datos.categoriaId);
  }

  get nombreDenominacion(): string {
    return this.denominacion;
  }
  get textoDescripcion(): string {
    return this.descripcion;
  }
  get estado(): EstadoConservacion {
    return this.estadoConservacion;
  }
  get idCategoria(): string {
    return this.categoriaId;
  }
}

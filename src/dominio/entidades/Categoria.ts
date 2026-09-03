export class Categoria {
  private constructor(
    private readonly id: string,
    private readonly nombre: string,
  ) {}

  static crear(id: string, nombre: string): Categoria {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length === 0) {
      throw new Error('El nombre de la categoría no puede estar vacío.');
    }
    return new Categoria(id, nombreLimpio);
  }

  get identificador(): string {
    return this.id;
  }

  get nombreCategoria(): string {
    return this.nombre;
  }
}

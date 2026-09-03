import { Email } from '../objetos-valor/Email';
import { DatosUsuarioInvalidosError } from '../errores/ErrorDeDominio';

// Un mismo usuario puede actuar como vendedor y como postor. La contraseña
// llega ya cifrada desde la capa de aplicación; el dominio no ve texto plano.
export class Usuario {
  private constructor(
    private readonly id: string,
    private readonly nombre: string,
    private readonly correo: Email,
    private readonly contrasenaCifrada: string,
  ) {}

  static registrar(datos: {
    id: string;
    nombre: string;
    correo: Email;
    contrasenaCifrada: string;
  }): Usuario {
    const nombreLimpio = datos.nombre.trim();
    if (nombreLimpio.length === 0) {
      throw new DatosUsuarioInvalidosError('El nombre del usuario no puede estar vacío.');
    }
    if (datos.contrasenaCifrada.trim().length === 0) {
      throw new DatosUsuarioInvalidosError('La contraseña cifrada no puede estar vacía.');
    }
    return new Usuario(datos.id, nombreLimpio, datos.correo, datos.contrasenaCifrada);
  }

  get identificador(): string {
    return this.id;
  }
  get nombreCompleto(): string {
    return this.nombre;
  }
  get email(): Email {
    return this.correo;
  }
  get hashContrasena(): string {
    return this.contrasenaCifrada;
  }
}

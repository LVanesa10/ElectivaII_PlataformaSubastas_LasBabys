import { EmailInvalidoError } from '../errores/ErrorDeDominio';

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Solo valida el formato y normaliza a minúsculas. La unicidad del correo
// se comprueba en el caso de uso de registro, contra el repositorio.
export class Email {
  private constructor(private readonly direccion: string) {}

  static crear(valor: string): Email {
    const normalizado = valor.trim().toLowerCase();
    if (!PATRON_EMAIL.test(normalizado)) {
      throw new EmailInvalidoError();
    }
    return new Email(normalizado);
  }

  get valor(): string {
    return this.direccion;
  }

  esIgualA(otro: Email): boolean {
    return this.direccion === otro.direccion;
  }

  toString(): string {
    return this.direccion;
  }
}

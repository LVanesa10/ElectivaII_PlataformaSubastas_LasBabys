import { MontoMonetarioInvalidoError } from '../errores/ErrorDeDominio';

// Pesos colombianos, sin decimales y no negativos. No se puede construir
// un Dinero inválido: el constructor lanza si no se cumplen las condiciones.
export class Dinero {
  private constructor(private readonly monto: number) {}

  static pesos(valor: number): Dinero {
    if (!Number.isInteger(valor) || valor < 0) {
      throw new MontoMonetarioInvalidoError();
    }
    return new Dinero(valor);
  }

  static cero(): Dinero {
    return new Dinero(0);
  }

  get valor(): number {
    return this.monto;
  }

  esMayorQue(otro: Dinero): boolean {
    return this.valor > otro.valor;
  }

  esMayorOIgualQue(otro: Dinero): boolean {
    return this.valor >= otro.valor;
  }

  esIgualA(otro: Dinero): boolean {
    return this.valor === otro.valor;
  }

  sumar(otro: Dinero): Dinero {
    return Dinero.pesos(this.valor + otro.valor);
  }

  toString(): string {
    return `$${this.valor.toLocaleString('es-CO')} COP`;
  }
}

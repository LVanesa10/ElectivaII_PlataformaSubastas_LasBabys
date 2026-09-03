import { Dinero } from '../objetos-valor/Dinero';

// Entidad interna del agregado Subasta. Una vez creada es inmutable:
// no hay operación de retiro ni de eliminación.
export class Puja {
  private constructor(
    private readonly id: string,
    private readonly postorId: string,
    private readonly monto: Dinero,
    private readonly registradaEn: Date,
  ) {}

  static registrar(id: string, postorId: string, monto: Dinero, registradaEn: Date): Puja {
    return new Puja(id, postorId, monto, registradaEn);
  }

  get identificador(): string {
    return this.id;
  }
  get idPostor(): string {
    return this.postorId;
  }
  get valorOfertado(): Dinero {
    return this.monto;
  }
  get fechaRegistro(): Date {
    return new Date(this.registradaEn.getTime());
  }
}

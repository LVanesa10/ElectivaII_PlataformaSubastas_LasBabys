import { Dinero } from '../objetos-valor/Dinero';

// Registro de auditoría de una puja que no fue aceptada. El motivo se guarda
// como el código del error de dominio, no como el texto del mensaje.
export class IntentoPujaRechazado {
  private constructor(
    private readonly id: string,
    private readonly postorId: string,
    private readonly montoIntentado: Dinero,
    private readonly codigoMotivo: string,
    private readonly ocurridoEn: Date,
  ) {}

  static registrar(datos: {
    id: string;
    postorId: string;
    montoIntentado: Dinero;
    codigoMotivo: string;
    ocurridoEn: Date;
  }): IntentoPujaRechazado {
    return new IntentoPujaRechazado(
      datos.id,
      datos.postorId,
      datos.montoIntentado,
      datos.codigoMotivo,
      datos.ocurridoEn,
    );
  }

  get identificador(): string {
    return this.id;
  }
  get idPostor(): string {
    return this.postorId;
  }
  get monto(): Dinero {
    return this.montoIntentado;
  }
  get motivo(): string {
    return this.codigoMotivo;
  }
  get fecha(): Date {
    return new Date(this.ocurridoEn.getTime());
  }
}

import { EstadoSubastaInvalidoError } from '../errores/ErrorDeDominio';

export type NombreEstadoSubasta = 'ABIERTA' | 'CANCELADA' | 'ADJUDICADA' | 'DESIERTA' | 'PAGADA' | 'INCUMPLIDA';

// Ciclo de vida:
//   ABIERTA ──cancelar──▶ CANCELADA
//   ABIERTA ──cierre sin pujas──▶ DESIERTA
//   ABIERTA ──cierre con pujas──▶ ADJUDICADA ──pago confirmado──▶ PAGADA
//                                            └─plazo vencido────▶ INCUMPLIDA
export class EstadoSubasta {
  private static readonly ABIERTA_ = new EstadoSubasta('ABIERTA');
  private static readonly CANCELADA_ = new EstadoSubasta('CANCELADA');
  private static readonly ADJUDICADA_ = new EstadoSubasta('ADJUDICADA');
  private static readonly DESIERTA_ = new EstadoSubasta('DESIERTA');
  private static readonly PAGADA_ = new EstadoSubasta('PAGADA');
  private static readonly INCUMPLIDA_ = new EstadoSubasta('INCUMPLIDA');

  private static readonly TODOS = [
    EstadoSubasta.ABIERTA_,
    EstadoSubasta.CANCELADA_,
    EstadoSubasta.ADJUDICADA_,
    EstadoSubasta.DESIERTA_,
    EstadoSubasta.PAGADA_,
    EstadoSubasta.INCUMPLIDA_,
  ];

  private constructor(private readonly nombre: NombreEstadoSubasta) {}

  static abierta(): EstadoSubasta {
    return EstadoSubasta.ABIERTA_;
  }
  static cancelada(): EstadoSubasta {
    return EstadoSubasta.CANCELADA_;
  }
  static adjudicada(): EstadoSubasta {
    return EstadoSubasta.ADJUDICADA_;
  }
  static desierta(): EstadoSubasta {
    return EstadoSubasta.DESIERTA_;
  }
  static pagada(): EstadoSubasta {
    return EstadoSubasta.PAGADA_;
  }
  static incumplida(): EstadoSubasta {
    return EstadoSubasta.INCUMPLIDA_;
  }

  // Reconstruye el estado a partir de su nombre (filtros, persistencia).
  // Un nombre desconocido no produce un estado inválido: se rechaza.
  static desdeNombre(nombre: string): EstadoSubasta {
    const estado = EstadoSubasta.TODOS.find((candidato) => candidato.nombre === nombre);
    if (estado === undefined) {
      throw new EstadoSubastaInvalidoError(nombre, EstadoSubasta.TODOS.map((e) => e.nombre));
    }
    return estado;
  }

  esAbierta(): boolean {
    return this.nombre === 'ABIERTA';
  }

  esAdjudicada(): boolean {
    return this.nombre === 'ADJUDICADA';
  }

  esFinal(): boolean {
    return this.nombre !== 'ABIERTA';
  }

  get valor(): NombreEstadoSubasta {
    return this.nombre;
  }

  toString(): string {
    return this.nombre;
  }
}

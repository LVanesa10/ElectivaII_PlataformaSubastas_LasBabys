export type NombreEstadoSubasta = 'ABIERTA' | 'CANCELADA' | 'ADJUDICADA' | 'DESIERTA';

export class EstadoSubasta {
  private static readonly ABIERTA_ = new EstadoSubasta('ABIERTA');
  private static readonly CANCELADA_ = new EstadoSubasta('CANCELADA');
  private static readonly ADJUDICADA_ = new EstadoSubasta('ADJUDICADA');
  private static readonly DESIERTA_ = new EstadoSubasta('DESIERTA');

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

  esAbierta(): boolean {
    return this.nombre === 'ABIERTA';
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

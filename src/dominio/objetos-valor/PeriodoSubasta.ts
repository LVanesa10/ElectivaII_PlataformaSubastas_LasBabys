import {
  DuracionSubastaInvalidaError,
  FechaCierreAnteriorAPublicacionError,
} from '../errores/ErrorDeDominio';

const UNA_HORA_EN_MS = 60 * 60 * 1000;
const TREINTA_DIAS_EN_MS = 30 * 24 * UNA_HORA_EN_MS;

// Agrupa la fecha de publicación y la de cierre, y valida las dos juntas:
// el cierre debe ser posterior a la publicación y la duración debe estar
// entre una hora y treinta días.
export class PeriodoSubasta {
  private constructor(
    private readonly publicadaEn: Date,
    private readonly cierraEn: Date,
  ) {}

  static crear(publicadaEn: Date, cierraEn: Date): PeriodoSubasta {
    const duracionMs = cierraEn.getTime() - publicadaEn.getTime();

    if (duracionMs <= 0) {
      throw new FechaCierreAnteriorAPublicacionError();
    }
    if (duracionMs < UNA_HORA_EN_MS || duracionMs > TREINTA_DIAS_EN_MS) {
      throw new DuracionSubastaInvalidaError(1, 30);
    }

    return new PeriodoSubasta(publicadaEn, cierraEn);
  }

  get fechaPublicacion(): Date {
    return new Date(this.publicadaEn.getTime());
  }

  get fechaCierre(): Date {
    return new Date(this.cierraEn.getTime());
  }

  yaVencio(ahora: Date): boolean {
    return ahora.getTime() >= this.cierraEn.getTime();
  }
}

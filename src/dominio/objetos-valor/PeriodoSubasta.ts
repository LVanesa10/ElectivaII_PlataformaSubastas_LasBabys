import {
  DuracionSubastaInvalidaError,
  FechaCierreAnteriorAPublicacionError,
} from '../errores/ErrorDeDominio';

const UN_MINUTO_EN_MS = 60 * 1000;
const UNA_HORA_EN_MS = 60 * UN_MINUTO_EN_MS;
const TREINTA_DIAS_EN_MS = 30 * 24 * UNA_HORA_EN_MS;

// RN-03: duración mínima que exige el enunciado.
export const DURACION_MINIMA_RN03_MS = UNA_HORA_EN_MS;

// Agrupa la fecha de publicación y la de cierre, y valida las dos juntas:
// el cierre debe ser posterior a la publicación y la duración debe estar
// entre la mínima (una hora, RN-03) y treinta días.
export class PeriodoSubasta {
  private constructor(
    private readonly publicadaEn: Date,
    private readonly cierraEn: Date,
  ) {}

  // La duración mínima es la de RN-03 salvo que se indique otra; solo se
  // reduce a propósito para demostraciones (ver DURACION_MINIMA_MINUTOS).
  static crear(
    publicadaEn: Date,
    cierraEn: Date,
    duracionMinimaMs: number = DURACION_MINIMA_RN03_MS,
  ): PeriodoSubasta {
    const duracionMs = cierraEn.getTime() - publicadaEn.getTime();

    if (duracionMs <= 0) {
      throw new FechaCierreAnteriorAPublicacionError();
    }
    if (duracionMs < duracionMinimaMs || duracionMs > TREINTA_DIAS_EN_MS) {
      throw new DuracionSubastaInvalidaError(duracionMinimaMs / UN_MINUTO_EN_MS, 30);
    }

    return new PeriodoSubasta(publicadaEn, cierraEn);
  }

  // Rehidrata un periodo ya guardado: se validó al publicarse, así que no se
  // vuelve a comprobar la duración.
  static reconstruir(publicadaEn: Date, cierraEn: Date): PeriodoSubasta {
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

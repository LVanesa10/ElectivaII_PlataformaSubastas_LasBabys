import { createHmac, timingSafeEqual } from 'crypto';
import { VerificadorOrigenPagos } from '../../aplicacion/puertos/VerificadorOrigenPagos';

const PREFIJO = 'sha256=';

// La pasarela y la plataforma comparten un secreto. La pasarela firma el
// cuerpo exacto de cada notificación con HMAC-SHA256 y envía la firma en el
// encabezado X-Pasarela-Firma con el formato "sha256=<hex>". Quien no conoce
// el secreto no puede producir una firma válida.
export class VerificadorFirmaHmac implements VerificadorOrigenPagos {
  constructor(private readonly secreto: string) {}

  static firmar(cuerpo: string, secreto: string): string {
    return PREFIJO + createHmac('sha256', secreto).update(cuerpo, 'utf8').digest('hex');
  }

  esAutentica(cuerpoOriginal: string, firma: string | undefined): boolean {
    if (this.secreto.length === 0 || firma === undefined || !firma.startsWith(PREFIJO)) {
      return false;
    }

    const esperada = Buffer.from(VerificadorFirmaHmac.firmar(cuerpoOriginal, this.secreto));
    const recibida = Buffer.from(firma);
    // Comparación en tiempo constante para no filtrar información por tiempos.
    return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
  }
}

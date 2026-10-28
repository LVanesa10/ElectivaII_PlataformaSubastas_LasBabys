// Comprueba que una notificación recibida provenga realmente de la pasarela
// de pagos (RN-18). El mecanismo concreto (firma HMAC, certificado, lista de
// IPs) es un detalle del adaptador.
export interface VerificadorOrigenPagos {
  esAutentica(cuerpoOriginal: string, firma: string | undefined): boolean;
}

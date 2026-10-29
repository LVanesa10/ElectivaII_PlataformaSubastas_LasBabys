import { Request, Response } from 'express';
import { ProcesarNotificacionPago } from '../../../aplicacion/casos-uso/ProcesarNotificacionPago';

export const ENCABEZADO_FIRMA = 'X-Pasarela-Firma';

export class WebhooksController {
  constructor(private readonly procesarNotificacionPago: ProcesarNotificacionPago) {}

  // El cuerpo llega sin interpretar (texto): la firma se verifica sobre los
  // bytes exactos que envió la pasarela.
  pagos = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.procesarNotificacionPago.ejecutar({
      cuerpoOriginal: typeof req.body === 'string' ? req.body : '',
      firma: req.header(ENCABEZADO_FIRMA),
    });
    res.status(200).json(resultado);
  };
}

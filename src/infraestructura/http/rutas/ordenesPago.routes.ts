import { Router } from 'express';
import { OrdenesPagoController } from '../controladores/OrdenesPagoController';
import { envolverAsync } from '../envolverAsync';
import { crearMiddlewareAutenticacion } from '../middlewares/autenticacion';
import { GeneradorToken } from '../../../aplicacion/puertos/GeneradorToken';

export function crearRutasOrdenesPago(controlador: OrdenesPagoController, tokens: GeneradorToken): Router {
  const router = Router();
  const autenticacion = crearMiddlewareAutenticacion(tokens);

  router.get('/', autenticacion, envolverAsync(controlador.listarMias));
  router.get('/:id', autenticacion, envolverAsync(controlador.detalle));

  return router;
}

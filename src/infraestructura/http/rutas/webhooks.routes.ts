import express, { Router } from 'express';
import { WebhooksController } from '../controladores/WebhooksController';
import { envolverAsync } from '../envolverAsync';

export function crearRutasWebhooks(controlador: WebhooksController): Router {
  const router = Router();

  // Sin autenticación de usuario: quien llama es la pasarela, y su origen se
  // verifica con la firma dentro del caso de uso.
  router.post('/pagos', express.text({ type: '*/*' }), envolverAsync(controlador.pagos));

  return router;
}

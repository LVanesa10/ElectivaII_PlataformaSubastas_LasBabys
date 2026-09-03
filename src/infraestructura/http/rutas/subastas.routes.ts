import { Router } from 'express';
import { SubastasController } from '../controladores/SubastasController';
import { PujasController } from '../controladores/PujasController';
import { envolverAsync } from '../envolverAsync';
import { validarCuerpo, reglas } from '../middlewares/validacion';
import { crearMiddlewareAutenticacion } from '../middlewares/autenticacion';
import { GeneradorToken } from '../../../aplicacion/puertos/GeneradorToken';

const ESTADOS_CONSERVACION = ['NUEVO', 'COMO_NUEVO', 'BUEN_ESTADO', 'ACEPTABLE', 'PARA_REPARAR'];

export function crearRutasSubastas(
  subastasControlador: SubastasController,
  pujasControlador: PujasController,
  tokens: GeneradorToken,
): Router {
  const router = Router();
  const autenticacion = crearMiddlewareAutenticacion(tokens);

  // El listado y el detalle son públicos; el presentador no expone datos
  // de contacto de los postores.
  router.get('/', envolverAsync(subastasControlador.listar));
  router.get('/:id', envolverAsync(subastasControlador.detalle));

  router.post(
    '/',
    autenticacion,
    validarCuerpo({
      denominacion: [reglas.requerido(), reglas.textoNoVacio()],
      descripcion: [reglas.requerido(), reglas.textoNoVacio()],
      estadoConservacion: [reglas.requerido(), reglas.unoDe(ESTADOS_CONSERVACION)],
      categoriaId: [reglas.requerido(), reglas.textoNoVacio()],
      precioBase: [reglas.requerido(), reglas.numeroPositivo()],
      incrementoMinimo: [reglas.requerido(), reglas.numeroPositivo()],
      fechaCierre: [reglas.requerido(), reglas.fechaIso()],
    }),
    envolverAsync(subastasControlador.publicar),
  );

  router.delete('/:id', autenticacion, envolverAsync(subastasControlador.cancelar));

  router.post(
    '/:id/pujas',
    autenticacion,
    validarCuerpo({
      monto: [reglas.requerido(), reglas.numero()],
    }),
    envolverAsync(pujasControlador.registrar),
  );

  return router;
}

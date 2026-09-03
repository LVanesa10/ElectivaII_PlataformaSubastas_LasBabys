import { Router } from 'express';
import { UsuariosController } from '../controladores/UsuariosController';
import { envolverAsync } from '../envolverAsync';
import { validarCuerpo, reglas } from '../middlewares/validacion';
import { crearMiddlewareAutenticacion } from '../middlewares/autenticacion';
import { GeneradorToken } from '../../../aplicacion/puertos/GeneradorToken';

export function crearRutasUsuarios(controlador: UsuariosController, tokens: GeneradorToken): Router {
  const router = Router();
  const autenticacion = crearMiddlewareAutenticacion(tokens);

  router.post(
    '/registro',
    validarCuerpo({
      nombre: [reglas.requerido(), reglas.textoNoVacio()],
      correo: [reglas.requerido(), reglas.textoNoVacio()],
      contrasena: [reglas.requerido(), reglas.textoNoVacio()],
    }),
    envolverAsync(controlador.registrar),
  );

  router.post(
    '/login',
    validarCuerpo({
      correo: [reglas.requerido(), reglas.textoNoVacio()],
      contrasena: [reglas.requerido(), reglas.textoNoVacio()],
    }),
    envolverAsync(controlador.login),
  );

  router.get('/perfil', autenticacion, envolverAsync(controlador.perfil));
  router.get('/notificaciones', autenticacion, envolverAsync(controlador.notificaciones));

  return router;
}

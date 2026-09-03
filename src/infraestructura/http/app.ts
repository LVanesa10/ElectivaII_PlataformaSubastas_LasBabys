import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '../config/swagger';
import { SubastaRepositorioMemoria } from '../persistencia/memoria/SubastaRepositorioMemoria';
import { UsuarioRepositorioMemoria } from '../persistencia/memoria/UsuarioRepositorioMemoria';
import { CategoriaRepositorioMemoria } from '../persistencia/memoria/CategoriaRepositorioMemoria';
import { NotificacionRepositorioMemoria } from '../persistencia/memoria/NotificacionRepositorioMemoria';

import { RelojDelSistema } from '../servicios/RelojDelSistema';
import { HasheadorBcrypt } from '../servicios/HasheadorBcrypt';
import { GeneradorTokenJwt } from '../servicios/GeneradorTokenJwt';
import { NotificadorConsola } from '../servicios/NotificadorConsola';

import { RegistrarUsuario } from '../../aplicacion/casos-uso/RegistrarUsuario';
import { IniciarSesion } from '../../aplicacion/casos-uso/IniciarSesion';
import { ConsultarPerfil } from '../../aplicacion/casos-uso/ConsultarPerfil';
import { ConsultarNotificaciones } from '../../aplicacion/casos-uso/ConsultarNotificaciones';
import { PublicarSubasta } from '../../aplicacion/casos-uso/PublicarSubasta';
import { ListarSubastas } from '../../aplicacion/casos-uso/ListarSubastas';
import { ConsultarSubasta } from '../../aplicacion/casos-uso/ConsultarSubasta';
import { CancelarSubasta } from '../../aplicacion/casos-uso/CancelarSubasta';
import { RegistrarPuja } from '../../aplicacion/casos-uso/RegistrarPuja';

import { UsuariosController } from './controladores/UsuariosController';
import { SubastasController } from './controladores/SubastasController';
import { PujasController } from './controladores/PujasController';
import { crearRutasUsuarios } from './rutas/usuarios.routes';
import { crearRutasSubastas } from './rutas/subastas.routes';
import { manejoErrores } from './middlewares/manejoErrores';
import { presentarCategoria } from './presentadores';

export function crearAplicacion(): Express {
  const secretoJwt = process.env.JWT_SECRETO ?? 'secreto-de-desarrollo-cambiar-en-produccion';

  // Adaptadores
  const subastaRepositorio = new SubastaRepositorioMemoria();
  const usuarioRepositorio = new UsuarioRepositorioMemoria();
  const categoriaRepositorio = new CategoriaRepositorioMemoria();
  const notificacionRepositorio = new NotificacionRepositorioMemoria();

  const reloj = new RelojDelSistema();
  const hasheador = new HasheadorBcrypt();
  const tokens = new GeneradorTokenJwt(secretoJwt);
  const notificador = new NotificadorConsola(notificacionRepositorio, reloj);

  // Casos de uso
  const registrarUsuario = new RegistrarUsuario(usuarioRepositorio, hasheador);
  const iniciarSesion = new IniciarSesion(usuarioRepositorio, hasheador, tokens);
  const consultarPerfil = new ConsultarPerfil(usuarioRepositorio, subastaRepositorio);
  const consultarNotificaciones = new ConsultarNotificaciones(usuarioRepositorio, notificacionRepositorio);

  const publicarSubasta = new PublicarSubasta(subastaRepositorio, usuarioRepositorio, categoriaRepositorio, reloj);
  const listarSubastas = new ListarSubastas(subastaRepositorio, reloj);
  const consultarSubasta = new ConsultarSubasta(subastaRepositorio, reloj, notificador);
  const cancelarSubasta = new CancelarSubasta(subastaRepositorio, reloj);
  const registrarPuja = new RegistrarPuja(subastaRepositorio, reloj, notificador);

  // Controladores
  const usuariosControlador = new UsuariosController(
    registrarUsuario,
    iniciarSesion,
    consultarPerfil,
    consultarNotificaciones,
  );
  const subastasControlador = new SubastasController(publicarSubasta, listarSubastas, consultarSubasta, cancelarSubasta);
  const pujasControlador = new PujasController(registrarPuja);

  const app = express();
  app.use(express.json());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/salud', (_req, res) => {
    res.status(200).json({ estado: 'ok' });
  });

  app.get('/categorias', async (_req, res, next) => {
    try {
      const categorias = await categoriaRepositorio.listarTodas();
      res.status(200).json(categorias.map(presentarCategoria));
    } catch (error) {
      next(error);
    }
  });

  app.use('/usuarios', crearRutasUsuarios(usuariosControlador, tokens));
  app.use('/subastas', crearRutasSubastas(subastasControlador, pujasControlador, tokens));

  app.use((_req, res) => {
    res.status(404).json({ error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: 'El recurso solicitado no existe.' } });
  });

  // El middleware de manejo de errores siempre se registra al final.
  app.use(manejoErrores);

  return app;
}

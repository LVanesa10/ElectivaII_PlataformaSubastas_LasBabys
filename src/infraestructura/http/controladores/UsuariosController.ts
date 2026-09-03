import { Response } from 'express';
import { RegistrarUsuario } from '../../../aplicacion/casos-uso/RegistrarUsuario';
import { IniciarSesion } from '../../../aplicacion/casos-uso/IniciarSesion';
import { ConsultarPerfil } from '../../../aplicacion/casos-uso/ConsultarPerfil';
import { ConsultarNotificaciones } from '../../../aplicacion/casos-uso/ConsultarNotificaciones';
import { PeticionAutenticada } from '../middlewares/autenticacion';
import { presentarSubasta, presentarUsuario, presentarNotificacion } from '../presentadores';

export class UsuariosController {
  constructor(
    private readonly registrarUsuario: RegistrarUsuario,
    private readonly iniciarSesion: IniciarSesion,
    private readonly consultarPerfil: ConsultarPerfil,
    private readonly consultarNotificaciones: ConsultarNotificaciones,
  ) {}

  registrar = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const usuario = await this.registrarUsuario.ejecutar({
      nombre: req.body.nombre,
      correo: req.body.correo,
      contrasena: req.body.contrasena,
    });
    res.status(201).json(presentarUsuario(usuario));
  };

  login = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const sesion = await this.iniciarSesion.ejecutar({
      correo: req.body.correo,
      contrasena: req.body.contrasena,
    });
    res.status(200).json(sesion);
  };

  perfil = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const perfil = await this.consultarPerfil.ejecutar(req.usuarioId!);
    res.status(200).json({
      usuario: presentarUsuario(perfil.usuario),
      subastasPublicadas: perfil.subastasPublicadas.map((s) => presentarSubasta(s)),
      subastasConParticipacion: perfil.subastasConParticipacion.map((s) => presentarSubasta(s)),
    });
  };

  notificaciones = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const notificaciones = await this.consultarNotificaciones.ejecutar(req.usuarioId!);
    res.status(200).json(notificaciones.map(presentarNotificacion));
  };
}

import { Notificacion } from '../../dominio/entidades/Notificacion';
import { UsuarioNoEncontradoError } from '../../dominio/errores/ErrorDeDominio';
import { UsuarioRepositorio } from '../puertos/UsuarioRepositorio';
import { NotificacionRepositorio } from '../puertos/NotificacionRepositorio';

export class ConsultarNotificaciones {
  constructor(
    private readonly usuarios: UsuarioRepositorio,
    private readonly notificaciones: NotificacionRepositorio,
  ) {}

  async ejecutar(usuarioId: string): Promise<Notificacion[]> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (usuario === null) {
      throw new UsuarioNoEncontradoError();
    }

    return this.notificaciones.listarPorDestinatario(usuarioId);
  }
}

import { Usuario } from '../../dominio/entidades/Usuario';
import { Subasta } from '../../dominio/entidades/Subasta';
import { UsuarioNoEncontradoError } from '../../dominio/errores/ErrorDeDominio';
import { UsuarioRepositorio } from '../puertos/UsuarioRepositorio';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';

export interface PerfilUsuario {
  usuario: Usuario;
  subastasPublicadas: Subasta[];
  subastasConParticipacion: Subasta[];
}

export class ConsultarPerfil {
  constructor(
    private readonly usuarios: UsuarioRepositorio,
    private readonly subastas: SubastaRepositorio,
  ) {}

  async ejecutar(usuarioId: string): Promise<PerfilUsuario> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    if (usuario === null) {
      throw new UsuarioNoEncontradoError();
    }

    const [subastasPublicadas, subastasConParticipacion] = await Promise.all([
      this.subastas.listarPorVendedor(usuarioId),
      this.subastas.listarConParticipacionDe(usuarioId),
    ]);

    return { usuario, subastasPublicadas, subastasConParticipacion };
  }
}

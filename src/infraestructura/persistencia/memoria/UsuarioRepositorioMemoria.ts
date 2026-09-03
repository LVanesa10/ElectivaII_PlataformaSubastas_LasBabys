import { v4 as uuid } from 'uuid';
import { Usuario } from '../../../dominio/entidades/Usuario';
import { Email } from '../../../dominio/objetos-valor/Email';
import { UsuarioRepositorio } from '../../../aplicacion/puertos/UsuarioRepositorio';

export class UsuarioRepositorioMemoria implements UsuarioRepositorio {
  private readonly usuariosPorId = new Map<string, Usuario>();

  async guardar(usuario: Usuario): Promise<void> {
    this.usuariosPorId.set(usuario.identificador, usuario);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuariosPorId.get(id) ?? null;
  }

  async buscarPorEmail(email: Email): Promise<Usuario | null> {
    for (const usuario of this.usuariosPorId.values()) {
      if (usuario.email.esIgualA(email)) {
        return usuario;
      }
    }
    return null;
  }

  async existeEmail(email: Email): Promise<boolean> {
    return (await this.buscarPorEmail(email)) !== null;
  }

  siguienteId(): string {
    return uuid();
  }
}

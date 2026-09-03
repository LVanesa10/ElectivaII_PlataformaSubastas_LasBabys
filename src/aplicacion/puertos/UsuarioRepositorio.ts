import { Usuario } from '../../dominio/entidades/Usuario';
import { Email } from '../../dominio/objetos-valor/Email';

export interface UsuarioRepositorio {
  guardar(usuario: Usuario): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: Email): Promise<Usuario | null>;
  existeEmail(email: Email): Promise<boolean>;
  siguienteId(): string;
}

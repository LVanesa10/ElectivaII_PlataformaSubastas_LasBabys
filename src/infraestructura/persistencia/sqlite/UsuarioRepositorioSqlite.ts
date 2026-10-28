import { v4 as uuid } from 'uuid';
import { Usuario } from '../../../dominio/entidades/Usuario';
import { Email } from '../../../dominio/objetos-valor/Email';
import { UsuarioRepositorio } from '../../../aplicacion/puertos/UsuarioRepositorio';
import { ConexionSqlite } from './BaseDatosSqlite';

interface FilaUsuario {
  id: string;
  nombre: string;
  correo: string;
  contrasena_cifrada: string;
}

export class UsuarioRepositorioSqlite implements UsuarioRepositorio {
  constructor(private readonly bd: ConexionSqlite) {}

  async guardar(usuario: Usuario): Promise<void> {
    this.bd
      .prepare(
        `INSERT INTO usuarios (id, nombre, correo, contrasena_cifrada) VALUES (?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, contrasena_cifrada = excluded.contrasena_cifrada`,
      )
      .run(usuario.identificador, usuario.nombreCompleto, usuario.email.valor, usuario.hashContrasena);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const fila = this.bd.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as FilaUsuario | undefined;
    return fila ? this.rehidratar(fila) : null;
  }

  async buscarPorEmail(email: Email): Promise<Usuario | null> {
    const fila = this.bd.prepare('SELECT * FROM usuarios WHERE correo = ?').get(email.valor) as FilaUsuario | undefined;
    return fila ? this.rehidratar(fila) : null;
  }

  async existeEmail(email: Email): Promise<boolean> {
    return this.bd.prepare('SELECT 1 FROM usuarios WHERE correo = ?').get(email.valor) !== undefined;
  }

  siguienteId(): string {
    return uuid();
  }

  private rehidratar(fila: FilaUsuario): Usuario {
    return Usuario.registrar({
      id: fila.id,
      nombre: fila.nombre,
      correo: Email.crear(fila.correo),
      contrasenaCifrada: fila.contrasena_cifrada,
    });
  }
}

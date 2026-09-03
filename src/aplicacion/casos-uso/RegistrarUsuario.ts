import { Usuario } from '../../dominio/entidades/Usuario';
import { Email } from '../../dominio/objetos-valor/Email';
import { CorreoDuplicadoError } from '../../dominio/errores/ErrorDeDominio';
import { UsuarioRepositorio } from '../puertos/UsuarioRepositorio';
import { HasheadorContrasenas } from '../puertos/HasheadorContrasenas';

export interface DatosRegistrarUsuario {
  nombre: string;
  correo: string;
  contrasena: string;
}

export class RegistrarUsuario {
  constructor(
    private readonly usuarios: UsuarioRepositorio,
    private readonly hasheador: HasheadorContrasenas,
  ) {}

  async ejecutar(datos: DatosRegistrarUsuario): Promise<Usuario> {
    const email = Email.crear(datos.correo);

    // El correo es único en la plataforma; se comprueba contra el repositorio.
    if (await this.usuarios.existeEmail(email)) {
      throw new CorreoDuplicadoError();
    }

    const contrasenaCifrada = await this.hasheador.cifrar(datos.contrasena);

    const usuario = Usuario.registrar({
      id: this.usuarios.siguienteId(),
      nombre: datos.nombre,
      correo: email,
      contrasenaCifrada,
    });

    await this.usuarios.guardar(usuario);
    return usuario;
  }
}

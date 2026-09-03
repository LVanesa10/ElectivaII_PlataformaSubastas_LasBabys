import { Email } from '../../dominio/objetos-valor/Email';
import { CredencialesInvalidasError } from '../../dominio/errores/ErrorDeDominio';
import { UsuarioRepositorio } from '../puertos/UsuarioRepositorio';
import { HasheadorContrasenas } from '../puertos/HasheadorContrasenas';
import { GeneradorToken } from '../puertos/GeneradorToken';

export interface DatosIniciarSesion {
  correo: string;
  contrasena: string;
}

export interface SesionIniciada {
  token: string;
  usuarioId: string;
  nombre: string;
}

export class IniciarSesion {
  constructor(
    private readonly usuarios: UsuarioRepositorio,
    private readonly hasheador: HasheadorContrasenas,
    private readonly tokens: GeneradorToken,
  ) {}

  async ejecutar(datos: DatosIniciarSesion): Promise<SesionIniciada> {
    // Si el correo viene mal formado se responde igual que con credenciales
    // incorrectas, para no filtrar detalles en el login.
    let email: Email;
    try {
      email = Email.crear(datos.correo);
    } catch {
      throw new CredencialesInvalidasError();
    }

    const usuario = await this.usuarios.buscarPorEmail(email);
    if (usuario === null) {
      throw new CredencialesInvalidasError();
    }

    const contrasenaValida = await this.hasheador.verificar(datos.contrasena, usuario.hashContrasena);
    if (!contrasenaValida) {
      throw new CredencialesInvalidasError();
    }

    const token = this.tokens.generar({ usuarioId: usuario.identificador });

    return { token, usuarioId: usuario.identificador, nombre: usuario.nombreCompleto };
  }
}

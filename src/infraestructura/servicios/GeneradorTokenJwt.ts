import jwt from 'jsonwebtoken';
import { CargaUtilToken, GeneradorToken } from '../../aplicacion/puertos/GeneradorToken';

export class GeneradorTokenJwt implements GeneradorToken {
  constructor(
    private readonly secreto: string,
    private readonly duracion: string = '12h',
  ) {}

  generar(carga: CargaUtilToken): string {
    const opciones: jwt.SignOptions = { expiresIn: this.duracion as jwt.SignOptions['expiresIn'] };
    return jwt.sign(carga, this.secreto, opciones);
  }

  verificar(token: string): CargaUtilToken | null {
    try {
      const decodificado = jwt.verify(token, this.secreto);
      if (typeof decodificado === 'object' && decodificado !== null && 'usuarioId' in decodificado) {
        return { usuarioId: String((decodificado as Record<string, unknown>).usuarioId) };
      }
      return null;
    } catch {
      return null;
    }
  }
}

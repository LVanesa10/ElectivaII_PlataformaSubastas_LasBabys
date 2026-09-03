import { NextFunction, Request, Response } from 'express';
import { GeneradorToken } from '../../../aplicacion/puertos/GeneradorToken';

export interface PeticionAutenticada extends Request {
  usuarioId?: string;
}

// Verifica el token portador y, si es válido, adjunta el id del usuario.
// La autorización concreta de cada operación vive en el dominio o el caso de uso.
export function crearMiddlewareAutenticacion(tokens: GeneradorToken) {
  return function autenticacion(req: PeticionAutenticada, res: Response, next: NextFunction): void {
    const encabezado = req.header('Authorization');
    if (!encabezado?.startsWith('Bearer ')) {
      res.status(401).json({
        error: { codigo: 'TOKEN_AUSENTE', mensaje: 'Debe incluir un token de sesión válido.' },
      });
      return;
    }

    const token = encabezado.substring('Bearer '.length);
    const carga = tokens.verificar(token);
    if (carga === null) {
      res.status(401).json({
        error: { codigo: 'TOKEN_INVALIDO', mensaje: 'El token de sesión es inválido o expiró.' },
      });
      return;
    }

    req.usuarioId = carga.usuarioId;
    next();
  };
}

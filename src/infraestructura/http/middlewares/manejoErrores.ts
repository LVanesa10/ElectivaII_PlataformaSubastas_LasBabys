import { NextFunction, Request, Response } from 'express';
import { ErrorDeDominio } from '../../../dominio/errores/ErrorDeDominio';

// Traduce el código de cada error de dominio al estado HTTP que le toca.
// El dominio solo produce el código; este mapa vive únicamente aquí.
const MAPEO_CODIGO_A_ESTADO_HTTP: Record<string, number> = {
  RN01_PRECIO_BASE_INVALIDO: 400,
  RN01_INCREMENTO_MINIMO_INVALIDO: 400,
  RN02_FECHA_CIERRE_INVALIDA: 400,
  RN03_DURACION_INVALIDA: 400,
  RN04_SUBASTA_CON_PUJAS_NO_CANCELABLE: 409,
  RN05_SUBASTA_NO_MODIFICABLE: 409,
  RN06_SUBASTA_NO_ABIERTA: 409,
  RN07_VENDEDOR_NO_PUEDE_PUJAR: 403,
  RN08_PRIMERA_PUJA_INSUFICIENTE: 422,
  RN09_PUJA_INSUFICIENTE: 422,
  RN10_YA_ES_MEJOR_POSTOR: 409,
  RN21_MONTO_INVALIDO: 400,
  RN22_CORREO_DUPLICADO: 409,
  USUARIO_NO_ENCONTRADO: 404,
  SUBASTA_NO_ENCONTRADA: 404,
  CATEGORIA_NO_ENCONTRADA: 404,
  CREDENCIALES_INVALIDAS: 401,
  EMAIL_INVALIDO: 400,
  NO_AUTORIZADO: 403,
  ARTICULO_INVALIDO: 400,
  USUARIO_INVALIDO: 400,
};

export interface ErrorDeValidacionDeEntrada extends Error {
  codigo: string;
  detalles?: unknown;
}

export function manejoErrores(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ErrorDeDominio) {
    const estadoHttp = MAPEO_CODIGO_A_ESTADO_HTTP[error.codigo] ?? 400;
    res.status(estadoHttp).json({
      error: {
        codigo: error.codigo,
        mensaje: error.message,
      },
    });
    return;
  }

  const posibleErrorDeValidacion = error as Partial<ErrorDeValidacionDeEntrada>;
  if (posibleErrorDeValidacion?.codigo === 'ENTRADA_INVALIDA') {
    res.status(400).json({
      error: {
        codigo: 'ENTRADA_INVALIDA',
        mensaje: posibleErrorDeValidacion.message ?? 'Los datos enviados no tienen el formato esperado.',
        detalles: posibleErrorDeValidacion.detalles,
      },
    });
    return;
  }

  console.error('[error-no-controlado]', error);
  res.status(500).json({
    error: {
      codigo: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error inesperado en el servidor.',
    },
  });
}

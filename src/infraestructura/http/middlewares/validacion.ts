import { NextFunction, Request, Response } from 'express';

export type ReglaDeCampo = (valor: unknown) => string | null;

export type EsquemaDeValidacion = Record<string, ReglaDeCampo[]>;

// Solo valida formato: tipos, presencia y forma básica de los campos.
// Las reglas de negocio no se tocan aquí.
export function validarCuerpo(esquema: EsquemaDeValidacion) {
  return function middlewareValidacion(req: Request, res: Response, next: NextFunction): void {
    const errores: Record<string, string> = {};

    for (const [campo, reglasDelCampo] of Object.entries(esquema)) {
      const valor = (req.body as Record<string, unknown>)?.[campo];
      for (const regla of reglasDelCampo) {
        const mensaje = regla(valor);
        if (mensaje !== null) {
          errores[campo] = mensaje;
          break;
        }
      }
    }

    if (Object.keys(errores).length > 0) {
      res.status(400).json({
        error: {
          codigo: 'ENTRADA_INVALIDA',
          mensaje: 'Los datos enviados no tienen el formato esperado.',
          detalles: errores,
        },
      });
      return;
    }

    next();
  };
}

export const reglas = {
  requerido: (): ReglaDeCampo => (valor) =>
    valor === undefined || valor === null || valor === '' ? 'Este campo es obligatorio.' : null,

  textoNoVacio: (): ReglaDeCampo => (valor) =>
    valor !== undefined && (typeof valor !== 'string' || valor.trim().length === 0)
      ? 'Debe ser un texto no vacío.'
      : null,

  numero: (): ReglaDeCampo => (valor) =>
    valor !== undefined && typeof valor !== 'number' ? 'Debe ser un número.' : null,

  numeroPositivo: (): ReglaDeCampo => (valor) =>
    valor !== undefined && (typeof valor !== 'number' || valor <= 0) ? 'Debe ser un número mayor que cero.' : null,

  fechaIso: (): ReglaDeCampo => (valor) =>
    valor !== undefined && (typeof valor !== 'string' || Number.isNaN(Date.parse(valor)))
      ? 'Debe ser una fecha en formato ISO 8601.'
      : null,

  unoDe: (opciones: string[]): ReglaDeCampo => (valor) =>
    valor !== undefined && (typeof valor !== 'string' || !opciones.includes(valor))
      ? `Debe ser uno de: ${opciones.join(', ')}.`
      : null,
};

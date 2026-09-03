import { NextFunction, Request, RequestHandler, Response } from 'express';

type ManejadorAsync = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Express no reenvía solo las excepciones de handlers async al middleware de
// errores; este envoltorio se encarga de ello.
export function envolverAsync(manejador: ManejadorAsync): RequestHandler {
  return (req, res, next) => {
    manejador(req, res, next).catch(next);
  };
}

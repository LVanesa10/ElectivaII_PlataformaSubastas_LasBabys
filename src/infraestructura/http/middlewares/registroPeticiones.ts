import { NextFunction, Request, Response } from 'express';

// Registra en consola cada petición con su estado y duración (RNF-17).
export function registroPeticiones(req: Request, res: Response, next: NextFunction): void {
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const milisegundos = Number(process.hrtime.bigint() - inicio) / 1_000_000;
    console.log(
      `[${new Date().toISOString()}] [http] ${req.method} ${req.originalUrl} → ${res.statusCode} (${milisegundos.toFixed(1)} ms)`,
    );
  });
  next();
}

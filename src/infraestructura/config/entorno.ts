import 'dotenv/config';

export type TipoPersistencia = 'sqlite' | 'memoria';

export interface Configuracion {
  puerto: number;
  jwtSecreto: string;
  persistencia: TipoPersistencia;
  rutaBaseDatos: string;
  pasarelaSecreto: string;
  duracionMinimaMinutos: number;
}

// Toda la configuración dependiente del entorno se lee aquí (RNF-10). Los
// nombres de las variables están en .env.example.
export function leerConfiguracion(entorno: NodeJS.ProcessEnv = process.env): Configuracion {
  const jwtSecreto = entorno.JWT_SECRETO ?? '';
  if (jwtSecreto.trim() === '') {
    throw new Error('Falta la variable de entorno JWT_SECRETO. Copie .env.example a .env y complétela.');
  }

  const persistencia = (entorno.PERSISTENCIA ?? 'sqlite') as TipoPersistencia;
  if (persistencia !== 'sqlite' && persistencia !== 'memoria') {
    throw new Error('PERSISTENCIA debe ser "sqlite" o "memoria".');
  }

  // Por defecto, la duración mínima de RN-03. Solo se reduce para demostrar
  // el cierre en vivo sin esperar una hora.
  const duracionMinimaMinutos = entorno.DURACION_MINIMA_MINUTOS
    ? Number(entorno.DURACION_MINIMA_MINUTOS)
    : 60;
  if (!Number.isInteger(duracionMinimaMinutos) || duracionMinimaMinutos < 1) {
    throw new Error('DURACION_MINIMA_MINUTOS debe ser un número entero de minutos mayor que cero.');
  }

  return {
    puerto: entorno.PUERTO ? Number(entorno.PUERTO) : 3000,
    jwtSecreto,
    persistencia,
    rutaBaseDatos: entorno.RUTA_BASE_DATOS ?? './datos/subastas.db',
    pasarelaSecreto: entorno.PASARELA_SECRETO ?? '',
    duracionMinimaMinutos,
  };
}

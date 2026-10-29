import 'dotenv/config';

export type TipoPersistencia = 'sqlite' | 'memoria';

export interface Configuracion {
  puerto: number;
  jwtSecreto: string;
  persistencia: TipoPersistencia;
  rutaBaseDatos: string;
  pasarelaSecreto: string;
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

  return {
    puerto: entorno.PUERTO ? Number(entorno.PUERTO) : 3000,
    jwtSecreto,
    persistencia,
    rutaBaseDatos: entorno.RUTA_BASE_DATOS ?? './datos/subastas.db',
    pasarelaSecreto: entorno.PASARELA_SECRETO ?? '',
  };
}

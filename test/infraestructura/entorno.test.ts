import { leerConfiguracion } from '../../src/infraestructura/config/entorno';

describe('leerConfiguracion', () => {
  test('sin DURACION_MINIMA_MINUTOS aplica la hora de RN-03', () => {
    expect(leerConfiguracion({ JWT_SECRETO: 'x' }).duracionMinimaMinutos).toBe(60);
  });

  test('acepta una duración mínima de demostración', () => {
    expect(leerConfiguracion({ JWT_SECRETO: 'x', DURACION_MINIMA_MINUTOS: '2' }).duracionMinimaMinutos).toBe(2);
  });

  test('rechaza una duración mínima que no es un entero positivo', () => {
    expect(() => leerConfiguracion({ JWT_SECRETO: 'x', DURACION_MINIMA_MINUTOS: '0' })).toThrow(
      'DURACION_MINIMA_MINUTOS',
    );
    expect(() => leerConfiguracion({ JWT_SECRETO: 'x', DURACION_MINIMA_MINUTOS: 'dos' })).toThrow(
      'DURACION_MINIMA_MINUTOS',
    );
  });
});

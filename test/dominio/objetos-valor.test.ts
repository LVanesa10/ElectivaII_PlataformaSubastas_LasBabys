import { Dinero } from '../../src/dominio/objetos-valor/Dinero';
import { Email } from '../../src/dominio/objetos-valor/Email';
import { Articulo } from '../../src/dominio/objetos-valor/Articulo';
import { Usuario } from '../../src/dominio/entidades/Usuario';
import {
  MontoMonetarioInvalidoError,
  EmailInvalidoError,
  DatosArticuloInvalidosError,
  DatosUsuarioInvalidosError,
} from '../../src/dominio/errores/ErrorDeDominio';

describe('Dinero', () => {
  test('acepta valores enteros no negativos', () => {
    expect(Dinero.pesos(0).valor).toBe(0);
    expect(Dinero.pesos(150000).valor).toBe(150000);
  });

  test('rechaza valores negativos', () => {
    expect(() => Dinero.pesos(-1)).toThrow(MontoMonetarioInvalidoError);
  });

  test('rechaza valores decimales', () => {
    expect(() => Dinero.pesos(100.5)).toThrow(MontoMonetarioInvalidoError);
  });

  test('sumar produce un nuevo Dinero sin mutar los operandos', () => {
    const a = Dinero.pesos(100000);
    const b = Dinero.pesos(10000);
    const suma = a.sumar(b);
    expect(suma.valor).toBe(110000);
    expect(a.valor).toBe(100000);
  });
});

describe('Email', () => {
  test('acepta un correo con formato válido y lo normaliza a minúsculas', () => {
    const email = Email.crear('Usuario@Correo.com');
    expect(email.valor).toBe('usuario@correo.com');
  });

  test('rechaza un correo sin arroba', () => {
    expect(() => Email.crear('usuario-correo.com')).toThrow(EmailInvalidoError);
  });

  test('rechaza un correo sin dominio', () => {
    expect(() => Email.crear('usuario@')).toThrow(EmailInvalidoError);
  });
});

describe('Validaciones de dominio con error tipado', () => {
  test('Articulo rechaza denominación vacía con un error de dominio', () => {
    const crear = () =>
      Articulo.crear({ denominacion: '  ', descripcion: 'algo', estadoConservacion: 'NUEVO', categoriaId: 'c1' });
    expect(crear).toThrow(DatosArticuloInvalidosError);
    expect(crear).toThrow(/denominación/i);
  });

  test('Usuario rechaza nombre vacío con un error de dominio', () => {
    const registrar = () =>
      Usuario.registrar({ id: 'u1', nombre: '   ', correo: Email.crear('a@b.com'), contrasenaCifrada: 'hash' });
    expect(registrar).toThrow(DatosUsuarioInvalidosError);
  });
});

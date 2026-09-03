// Clase base de los errores de negocio. Cada uno lleva un código estable que
// la capa HTTP traduce a un estado; el dominio no conoce nada de HTTP.
export abstract class ErrorDeDominio extends Error {
  abstract readonly codigo: string;

  protected constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PrecioBaseInvalidoError extends ErrorDeDominio {
  readonly codigo = 'RN01_PRECIO_BASE_INVALIDO';
  constructor() {
    super('El precio base de la subasta debe ser mayor que cero.');
  }
}

export class IncrementoMinimoInvalidoError extends ErrorDeDominio {
  readonly codigo = 'RN01_INCREMENTO_MINIMO_INVALIDO';
  constructor() {
    super('El incremento mínimo de la subasta debe ser mayor que cero.');
  }
}

export class FechaCierreAnteriorAPublicacionError extends ErrorDeDominio {
  readonly codigo = 'RN02_FECHA_CIERRE_INVALIDA';
  constructor() {
    super('La fecha de cierre debe ser posterior al momento de publicación. La subasta no puede nacer vencida.');
  }
}

export class DuracionSubastaInvalidaError extends ErrorDeDominio {
  readonly codigo = 'RN03_DURACION_INVALIDA';
  constructor(minimoHoras: number, maximoDias: number) {
    super(`La duración de la subasta debe estar entre ${minimoHoras} hora(s) y ${maximoDias} día(s).`);
  }
}

export class SubastaConPujasNoCancelableError extends ErrorDeDominio {
  readonly codigo = 'RN04_SUBASTA_CON_PUJAS_NO_CANCELABLE';
  constructor() {
    super('La subasta ya recibió al menos una puja y la venta quedó comprometida; solo puede terminar por cierre.');
  }
}

export class SubastaNoModificableError extends ErrorDeDominio {
  readonly codigo = 'RN05_SUBASTA_NO_MODIFICABLE';
  constructor() {
    super('Los datos de una subasta publicada no pueden modificarse.');
  }
}

export class SubastaNoDisponibleParaPujarError extends ErrorDeDominio {
  readonly codigo = 'RN06_SUBASTA_NO_ABIERTA';
  constructor(estadoActual: string) {
    super(`La subasta no admite ofertas porque su estado actual es "${estadoActual}".`);
  }
}

export class VendedorNoPuedePujarError extends ErrorDeDominio {
  readonly codigo = 'RN07_VENDEDOR_NO_PUEDE_PUJAR';
  constructor() {
    super('Un usuario no puede pujar por un artículo que él mismo publicó.');
  }
}

export class PrimeraPujaInferiorAPrecioBaseError extends ErrorDeDominio {
  readonly codigo = 'RN08_PRIMERA_PUJA_INSUFICIENTE';
  constructor() {
    super('La primera puja de la subasta debe ser mayor o igual al precio base.');
  }
}

export class PujaInsuficienteError extends ErrorDeDominio {
  readonly codigo = 'RN09_PUJA_INSUFICIENTE';
  constructor(minimoRequerido: number) {
    super(`La puja debe superar la oferta vigente en al menos el incremento mínimo. Monto mínimo requerido: ${minimoRequerido}.`);
  }
}

export class UsuarioYaEsMejorPostorError extends ErrorDeDominio {
  readonly codigo = 'RN10_YA_ES_MEJOR_POSTOR';
  constructor() {
    super('El usuario ya es el mejor postor vigente; no puede superar su propia puja.');
  }
}

export class UsuarioNoEncontradoError extends ErrorDeDominio {
  readonly codigo = 'USUARIO_NO_ENCONTRADO';
  constructor() {
    super('El usuario indicado no existe.');
  }
}

export class SubastaNoEncontradaError extends ErrorDeDominio {
  readonly codigo = 'SUBASTA_NO_ENCONTRADA';
  constructor() {
    super('La subasta indicada no existe.');
  }
}

export class CategoriaNoEncontradaError extends ErrorDeDominio {
  readonly codigo = 'CATEGORIA_NO_ENCONTRADA';
  constructor() {
    super('La categoría indicada no existe.');
  }
}

export class CorreoDuplicadoError extends ErrorDeDominio {
  readonly codigo = 'RN22_CORREO_DUPLICADO';
  constructor() {
    super('El correo electrónico ya está registrado en la plataforma.');
  }
}

export class CredencialesInvalidasError extends ErrorDeDominio {
  readonly codigo = 'CREDENCIALES_INVALIDAS';
  constructor() {
    super('El correo o la contraseña son incorrectos.');
  }
}

export class MontoMonetarioInvalidoError extends ErrorDeDominio {
  readonly codigo = 'RN21_MONTO_INVALIDO';
  constructor() {
    super('Los valores monetarios deben ser enteros no negativos, expresados en pesos colombianos.');
  }
}

export class EmailInvalidoError extends ErrorDeDominio {
  readonly codigo = 'EMAIL_INVALIDO';
  constructor() {
    super('El formato del correo electrónico no es válido.');
  }
}

export class NoAutorizadoError extends ErrorDeDominio {
  readonly codigo = 'NO_AUTORIZADO';
  constructor(mensaje = 'No está autorizado para realizar esta operación.') {
    super(mensaje);
  }
}

export class DatosArticuloInvalidosError extends ErrorDeDominio {
  readonly codigo = 'ARTICULO_INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class DatosUsuarioInvalidosError extends ErrorDeDominio {
  readonly codigo = 'USUARIO_INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

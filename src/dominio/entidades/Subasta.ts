import { Articulo } from '../objetos-valor/Articulo';
import { Dinero } from '../objetos-valor/Dinero';
import { EstadoSubasta } from '../objetos-valor/EstadoSubasta';
import { PeriodoSubasta } from '../objetos-valor/PeriodoSubasta';
import { Puja } from './Puja';
import { IntentoPujaRechazado } from './IntentoPujaRechazado';
import { OrdenPago } from './OrdenPago';
import { EventoDeDominio } from '../eventos/EventoDeDominio';
import {
  ErrorDeDominio,
  PrecioBaseInvalidoError,
  IncrementoMinimoInvalidoError,
  SubastaConPujasNoCancelableError,
  SubastaNoModificableError,
  SubastaNoDisponibleParaPujarError,
  VendedorNoPuedePujarError,
  PrimeraPujaInferiorAPrecioBaseError,
  PujaInsuficienteError,
  UsuarioYaEsMejorPostorError,
  NoAutorizadoError,
} from '../errores/ErrorDeDominio';

export interface DatosPublicacionSubasta {
  id: string;
  vendedorId: string;
  articulo: Articulo;
  precioBase: Dinero;
  incrementoMinimo: Dinero;
  fechaCierre: Date;
}

// Raíz del agregado: las pujas, los intentos rechazados y la orden de pago
// solo se tocan a través de esta clase. El "ahora" siempre entra por parámetro.
export class Subasta {
  private estado: EstadoSubasta;
  private readonly pujas: Puja[] = [];
  private readonly intentosRechazados: IntentoPujaRechazado[] = [];
  private ordenPago: OrdenPago | undefined;
  private readonly eventosPendientes: EventoDeDominio[] = [];

  private constructor(
    private readonly id: string,
    private readonly vendedorId: string,
    private readonly articulo: Articulo,
    private readonly precioBase: Dinero,
    private readonly incrementoMinimo: Dinero,
    private readonly periodo: PeriodoSubasta,
  ) {
    this.estado = EstadoSubasta.abierta();
  }

  static publicar(datos: DatosPublicacionSubasta, ahora: Date): Subasta {
    if (datos.precioBase.valor <= 0) {
      throw new PrecioBaseInvalidoError();
    }
    if (datos.incrementoMinimo.valor <= 0) {
      throw new IncrementoMinimoInvalidoError();
    }
    const periodo = PeriodoSubasta.crear(ahora, datos.fechaCierre);

    return new Subasta(datos.id, datos.vendedorId, datos.articulo, datos.precioBase, datos.incrementoMinimo, periodo);
  }

  // Rehidrata una subasta guardada, sin repetir las validaciones de publicación.
  static reconstruir(datos: {
    id: string;
    vendedorId: string;
    articulo: Articulo;
    precioBase: Dinero;
    incrementoMinimo: Dinero;
    periodo: PeriodoSubasta;
    estado: EstadoSubasta;
    pujas: Puja[];
    intentosRechazados: IntentoPujaRechazado[];
    ordenPago?: OrdenPago;
  }): Subasta {
    const subasta = new Subasta(
      datos.id,
      datos.vendedorId,
      datos.articulo,
      datos.precioBase,
      datos.incrementoMinimo,
      datos.periodo,
    );
    subasta.estado = datos.estado;
    subasta.pujas.push(...datos.pujas);
    subasta.intentosRechazados.push(...datos.intentosRechazados);
    subasta.ordenPago = datos.ordenPago;
    return subasta;
  }

  get identificador(): string {
    return this.id;
  }
  get idVendedor(): string {
    return this.vendedorId;
  }
  get datosArticulo(): Articulo {
    return this.articulo;
  }
  get valorPrecioBase(): Dinero {
    return this.precioBase;
  }
  get valorIncrementoMinimo(): Dinero {
    return this.incrementoMinimo;
  }
  get estadoActual(): EstadoSubasta {
    return this.estado;
  }
  get fechaDeCierre(): Date {
    return this.periodo.fechaCierre;
  }
  get fechaDePublicacion(): Date {
    return this.periodo.fechaPublicacion;
  }
  get historialPujas(): ReadonlyArray<Puja> {
    return [...this.pujas];
  }
  get intentosFallidos(): ReadonlyArray<IntentoPujaRechazado> {
    return [...this.intentosRechazados];
  }
  get ordenDePago(): OrdenPago | undefined {
    return this.ordenPago;
  }

  private mejorPuja(): Puja | null {
    return this.pujas.length > 0 ? this.pujas[this.pujas.length - 1] : null;
  }

  ofertaVigente(): Dinero | null {
    return this.mejorPuja()?.valorOfertado ?? null;
  }

  mejorPostorActualId(): string | null {
    return this.mejorPuja()?.idPostor ?? null;
  }

  extraerEventosPendientes(): EventoDeDominio[] {
    const eventos = [...this.eventosPendientes];
    this.eventosPendientes.length = 0;
    return eventos;
  }

  // Cierre perezoso: se llama antes de cualquier consulta o puja.
  sincronizarCierre(ahora: Date): void {
    if (this.estado.esAbierta() && this.periodo.yaVencio(ahora)) {
      this.cerrar(ahora);
    }
  }

  private cerrar(ahora: Date): void {
    if (!this.estado.esAbierta()) {
      return;
    }

    const mejor = this.mejorPuja();
    if (mejor === null) {
      this.estado = EstadoSubasta.desierta();
      this.eventosPendientes.push({
        tipo: 'SUBASTA_DESIERTA',
        subastaId: this.id,
        vendedorId: this.vendedorId,
      });
      return;
    }

    this.estado = EstadoSubasta.adjudicada();
    this.ordenPago = OrdenPago.generar({
      id: `${this.id}-orden-pago`,
      subastaId: this.id,
      ganadorId: mejor.idPostor,
      monto: mejor.valorOfertado,
      generadaEn: ahora,
    });
    this.eventosPendientes.push({
      tipo: 'SUBASTA_ADJUDICADA',
      subastaId: this.id,
      ganadorId: mejor.idPostor,
      vendedorId: this.vendedorId,
      montoGanador: mejor.valorOfertado.valor,
    });
  }

  cancelar(vendedorId: string, ahora: Date): void {
    this.sincronizarCierre(ahora);

    if (this.vendedorId !== vendedorId) {
      throw new NoAutorizadoError('Solo el vendedor puede cancelar su propia subasta.');
    }
    if (this.pujas.length > 0) {
      throw new SubastaConPujasNoCancelableError();
    }
    if (!this.estado.esAbierta()) {
      throw new SubastaNoModificableError();
    }

    this.estado = EstadoSubasta.cancelada();
  }

  registrarPuja(postorId: string, monto: Dinero, ahora: Date): Puja {
    this.sincronizarCierre(ahora);

    try {
      this.validarPuja(postorId, monto);
    } catch (error) {
      if (error instanceof ErrorDeDominio) {
        this.registrarIntentoFallido(postorId, monto, error, ahora);
      }
      throw error;
    }

    const nuevaPuja = Puja.registrar(
      `${this.id}-puja-${this.pujas.length + 1}`,
      postorId,
      monto,
      ahora,
    );

    const postorSuperado = this.mejorPostorActualId();
    this.pujas.push(nuevaPuja);

    if (postorSuperado !== null && postorSuperado !== postorId) {
      this.eventosPendientes.push({
        tipo: 'POSTOR_SUPERADO',
        subastaId: this.id,
        postorSuperadoId: postorSuperado,
        nuevoMonto: monto.valor,
      });
    }
    this.eventosPendientes.push({
      tipo: 'NUEVA_PUJA_VIGENTE',
      subastaId: this.id,
      postorId,
      monto: monto.valor,
    });

    return nuevaPuja;
  }

  private validarPuja(postorId: string, monto: Dinero): void {
    if (!this.estado.esAbierta()) {
      throw new SubastaNoDisponibleParaPujarError(this.estado.valor);
    }
    if (postorId === this.vendedorId) {
      throw new VendedorNoPuedePujarError();
    }

    const mejor = this.mejorPuja();

    if (mejor === null) {
      if (!monto.esMayorOIgualQue(this.precioBase)) {
        throw new PrimeraPujaInferiorAPrecioBaseError();
      }
      return;
    }

    if (mejor.idPostor === postorId) {
      throw new UsuarioYaEsMejorPostorError();
    }

    const minimoRequerido = mejor.valorOfertado.sumar(this.incrementoMinimo);
    if (!monto.esMayorOIgualQue(minimoRequerido)) {
      throw new PujaInsuficienteError(minimoRequerido.valor);
    }
  }

  private registrarIntentoFallido(postorId: string, monto: Dinero, error: ErrorDeDominio, ahora: Date): void {
    this.intentosRechazados.push(
      IntentoPujaRechazado.registrar({
        id: `${this.id}-intento-${this.intentosRechazados.length + 1}`,
        postorId,
        montoIntentado: monto,
        codigoMotivo: error.codigo,
        ocurridoEn: ahora,
      }),
    );
  }
}

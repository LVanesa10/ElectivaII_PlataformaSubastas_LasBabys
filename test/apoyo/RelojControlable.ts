import { Reloj } from '../../src/aplicacion/puertos/Reloj';

// Reloj de pruebas: permite adelantar el tiempo para verificar el cierre
// perezoso y el vencimiento de la orden de pago sin esperar.
export class RelojControlable implements Reloj {
  constructor(private momento: Date) {}

  ahora(): Date {
    return new Date(this.momento.getTime());
  }

  adelantar(milisegundos: number): void {
    this.momento = new Date(this.momento.getTime() + milisegundos);
  }
}

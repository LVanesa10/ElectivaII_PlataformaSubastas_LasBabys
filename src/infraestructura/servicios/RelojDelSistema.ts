import { Reloj } from '../../aplicacion/puertos/Reloj';

export class RelojDelSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}

import bcrypt from 'bcryptjs';
import { HasheadorContrasenas } from '../../aplicacion/puertos/HasheadorContrasenas';

const RONDAS_DE_SAL = 10;

export class HasheadorBcrypt implements HasheadorContrasenas {
  async cifrar(contrasenaPlana: string): Promise<string> {
    return bcrypt.hash(contrasenaPlana, RONDAS_DE_SAL);
  }

  async verificar(contrasenaPlana: string, hash: string): Promise<boolean> {
    return bcrypt.compare(contrasenaPlana, hash);
  }
}

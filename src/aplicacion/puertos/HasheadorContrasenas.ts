export interface HasheadorContrasenas {
  cifrar(contrasenaPlana: string): Promise<string>;
  verificar(contrasenaPlana: string, hash: string): Promise<boolean>;
}

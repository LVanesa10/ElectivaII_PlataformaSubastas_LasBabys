// Se inyecta para que las pruebas puedan controlar el tiempo sin usar
// Date.now() dentro de los casos de uso.
export interface Reloj {
  ahora(): Date;
}

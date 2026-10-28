import { Subasta } from '../../dominio/entidades/Subasta';
import { SubastaRepositorio } from '../puertos/SubastaRepositorio';
import { NotificadorDeEventos } from '../puertos/NotificadorDeEventos';

// Paso final común de los casos de uso que modifican una subasta: primero se
// persiste el nuevo estado y después se anuncian los hechos ocurridos, de modo
// que quien reaccione a un evento consultando la API ya vea el cambio.
export async function persistirYAnunciar(
  subasta: Subasta,
  subastas: SubastaRepositorio,
  notificador: NotificadorDeEventos,
): Promise<void> {
  const eventos = subasta.extraerEventosPendientes();
  await subastas.guardar(subasta);
  for (const evento of eventos) {
    notificador.publicar(evento);
  }
}

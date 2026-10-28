import WebSocket from 'ws';

// Conexión abierta de un cliente. El usuario es opcional: un visitante sin
// sesión puede seguir una subasta, pero no recibe avisos personales.
export interface Conexion {
  socket: WebSocket;
  usuarioId: string | null;
  subastas: Set<string>;
}

// Quién está conectado y a qué subastas está suscrito cada uno. Solo lo usan
// los adaptadores de WebSocket; el resto de la aplicación no lo conoce.
export class RegistroConexiones {
  private readonly conexiones = new Set<Conexion>();
  private readonly suscritosPorSubasta = new Map<string, Set<Conexion>>();

  registrar(socket: WebSocket, usuarioId: string | null): Conexion {
    const conexion: Conexion = { socket, usuarioId, subastas: new Set() };
    this.conexiones.add(conexion);
    return conexion;
  }

  // Devuelve las subastas de las que se retiró, para avisar el nuevo conteo.
  retirar(conexion: Conexion): string[] {
    const subastas = [...conexion.subastas];
    for (const subastaId of subastas) {
      this.cancelarSuscripcion(conexion, subastaId);
    }
    this.conexiones.delete(conexion);
    return subastas;
  }

  suscribir(conexion: Conexion, subastaId: string): void {
    conexion.subastas.add(subastaId);
    let suscritos = this.suscritosPorSubasta.get(subastaId);
    if (suscritos === undefined) {
      suscritos = new Set();
      this.suscritosPorSubasta.set(subastaId, suscritos);
    }
    suscritos.add(conexion);
  }

  cancelarSuscripcion(conexion: Conexion, subastaId: string): void {
    conexion.subastas.delete(subastaId);
    const suscritos = this.suscritosPorSubasta.get(subastaId);
    suscritos?.delete(conexion);
    if (suscritos?.size === 0) {
      this.suscritosPorSubasta.delete(subastaId);
    }
  }

  suscritosA(subastaId: string): Conexion[] {
    return [...(this.suscritosPorSubasta.get(subastaId) ?? [])];
  }

  // RF-16: participantes distintos conectados a una subasta. Un mismo usuario
  // con varias pestañas cuenta una sola vez; cada visitante anónimo cuenta uno.
  cantidadParticipantes(subastaId: string): number {
    const identidades = new Set<unknown>();
    for (const conexion of this.suscritosA(subastaId)) {
      identidades.add(conexion.usuarioId ?? conexion);
    }
    return identidades.size;
  }

  conexionesDeUsuario(usuarioId: string): Conexion[] {
    return [...this.conexiones].filter((conexion) => conexion.usuarioId === usuarioId);
  }

  todas(): Conexion[] {
    return [...this.conexiones];
  }
}

import { IncomingMessage, Server } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { ErrorDeDominio } from '../../dominio/errores/ErrorDeDominio';
import { ConsultarSubasta } from '../../aplicacion/casos-uso/ConsultarSubasta';
import { GeneradorToken } from '../../aplicacion/puertos/GeneradorToken';
import { presentarSubasta } from '../http/presentadores';
import { Conexion, RegistroConexiones } from './RegistroConexiones';
import { DifusorWebSocket } from './DifusorWebSocket';
import { crearMensaje, enviar } from './mensajes';

export const RUTA_WEBSOCKET = '/ws';
const INTERVALO_LATIDO_MS = 30_000;

interface MensajeCliente {
  accion?: unknown;
  subastaId?: unknown;
}

// Adaptador de entrada de WebSockets. Acepta conexiones en /ws (con
// ?token=<JWT> opcional para identificar al usuario) y atiende dos acciones:
//   { "accion": "SUSCRIBIR", "subastaId": "..." }
//   { "accion": "CANCELAR_SUSCRIPCION", "subastaId": "..." }
// Al suscribirse, el cliente recibe de inmediato el estado actual de la
// subasta; consultarla también aplica el cierre perezoso si correspondía.
export class ServidorWebSocket {
  private wss: WebSocketServer | null = null;
  private latido: NodeJS.Timeout | null = null;
  private readonly vivas = new WeakSet<WebSocket>();

  constructor(
    private readonly registro: RegistroConexiones,
    private readonly difusor: DifusorWebSocket,
    private readonly consultarSubasta: ConsultarSubasta,
    private readonly tokens: GeneradorToken,
  ) {}

  conectar(servidorHttp: Server): void {
    this.wss = new WebSocketServer({ server: servidorHttp, path: RUTA_WEBSOCKET });
    this.wss.on('connection', (socket, peticion) => this.alConectar(socket, peticion));

    // Descarta las conexiones que dejaron de responder (red caída, pestaña
    // cerrada sin despedirse) para que el conteo de participantes sea real.
    this.latido = setInterval(() => {
      for (const conexion of this.registro.todas()) {
        if (!this.vivas.has(conexion.socket)) {
          conexion.socket.terminate();
          continue;
        }
        this.vivas.delete(conexion.socket);
        conexion.socket.ping();
      }
    }, INTERVALO_LATIDO_MS);
  }

  cerrar(): void {
    if (this.latido !== null) {
      clearInterval(this.latido);
    }
    for (const conexion of this.registro.todas()) {
      conexion.socket.terminate();
    }
    this.wss?.close();
  }

  private alConectar(socket: WebSocket, peticion: IncomingMessage): void {
    const usuarioId = this.identificarUsuario(peticion);
    const conexion = this.registro.registrar(socket, usuarioId);
    this.vivas.add(socket);
    console.log(`[ws] conexión abierta (usuario: ${usuarioId ?? 'anónimo'})`);

    socket.on('pong', () => this.vivas.add(socket));
    socket.on('message', (datos) => {
      this.alRecibir(conexion, datos.toString()).catch((error) => {
        console.error('[ws] error no controlado', error);
        enviar(socket, crearMensaje('ERROR', undefined, { codigo: 'ERROR_INTERNO', mensaje: 'Error inesperado.' }));
      });
    });
    socket.on('close', () => {
      for (const subastaId of this.registro.retirar(conexion)) {
        this.difusor.anunciarParticipantes(subastaId);
      }
      console.log(`[ws] conexión cerrada (usuario: ${usuarioId ?? 'anónimo'})`);
    });

    enviar(socket, crearMensaje('CONEXION_ESTABLECIDA', undefined, { usuarioId }));
  }

  // Un token ausente deja la conexión como anónima; uno inválido se ignora
  // igual, pues la información de las subastas es pública (RN-23).
  private identificarUsuario(peticion: IncomingMessage): string | null {
    const url = new URL(peticion.url ?? '', 'http://localhost');
    const token = url.searchParams.get('token');
    return token ? (this.tokens.verificar(token)?.usuarioId ?? null) : null;
  }

  private async alRecibir(conexion: Conexion, texto: string): Promise<void> {
    let mensaje: MensajeCliente;
    try {
      mensaje = JSON.parse(texto) as MensajeCliente;
    } catch {
      this.enviarError(conexion, 'MENSAJE_INVALIDO', 'El mensaje debe ser JSON.');
      return;
    }

    if (typeof mensaje.subastaId !== 'string' || mensaje.subastaId.trim() === '') {
      this.enviarError(conexion, 'MENSAJE_INVALIDO', 'Debe indicar "subastaId".');
      return;
    }
    const subastaId = mensaje.subastaId;

    switch (mensaje.accion) {
      case 'SUSCRIBIR':
        await this.suscribir(conexion, subastaId);
        return;
      case 'CANCELAR_SUSCRIPCION':
        this.registro.cancelarSuscripcion(conexion, subastaId);
        enviar(conexion.socket, crearMensaje('SUSCRIPCION_CANCELADA', subastaId));
        this.difusor.anunciarParticipantes(subastaId);
        return;
      default:
        this.enviarError(conexion, 'ACCION_DESCONOCIDA', 'Las acciones válidas son SUSCRIBIR y CANCELAR_SUSCRIPCION.');
    }
  }

  private async suscribir(conexion: Conexion, subastaId: string): Promise<void> {
    try {
      // Se suscribe antes de consultar: si la consulta cierra la subasta, el
      // anuncio del cierre también le llega a esta conexión.
      this.registro.suscribir(conexion, subastaId);
      const subasta = await this.consultarSubasta.ejecutar(subastaId);
      enviar(conexion.socket, crearMensaje('SUSCRIPCION_CONFIRMADA', subastaId));
      enviar(conexion.socket, crearMensaje('ESTADO_SUBASTA', subastaId, presentarSubasta(subasta, { incluirHistorial: true })));
      this.difusor.anunciarParticipantes(subastaId);
    } catch (error) {
      this.registro.cancelarSuscripcion(conexion, subastaId);
      if (error instanceof ErrorDeDominio) {
        this.enviarError(conexion, error.codigo, error.message, subastaId);
        return;
      }
      throw error;
    }
  }

  private enviarError(conexion: Conexion, codigo: string, mensaje: string, subastaId?: string): void {
    enviar(conexion.socket, crearMensaje('ERROR', subastaId, { codigo, mensaje }));
  }
}

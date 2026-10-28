import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import WebSocket from 'ws';
import { construirContenedor, Contenedor } from '../../src/infraestructura/contenedor';
import { VerificadorFirmaHmac } from '../../src/infraestructura/servicios/VerificadorFirmaHmac';
import { RelojControlable } from '../apoyo/RelojControlable';

const SECRETO_PASARELA = 'secreto-pasarela-pruebas';
const UNA_HORA_MS = 60 * 60 * 1000;

interface Mensaje {
  tipo: string;
  subastaId?: string;
  datos?: Record<string, unknown>;
}

// Cliente de WebSocket que acumula los mensajes recibidos y permite esperar
// uno de un tipo determinado.
class ClientePrueba {
  readonly recibidos: Mensaje[] = [];
  private constructor(readonly socket: WebSocket) {
    socket.on('message', (datos) => this.recibidos.push(JSON.parse(datos.toString())));
  }

  static async conectar(url: string): Promise<ClientePrueba> {
    const socket = new WebSocket(url);
    const cliente = new ClientePrueba(socket);
    await new Promise((resolver) => socket.once('open', resolver));
    return cliente;
  }

  suscribir(subastaId: string): void {
    this.socket.send(JSON.stringify({ accion: 'SUSCRIBIR', subastaId }));
  }

  async esperar(tipo: string, condicion: (m: Mensaje) => boolean = () => true): Promise<Mensaje> {
    for (let intento = 0; intento < 100; intento++) {
      const mensaje = this.recibidos.find((m) => m.tipo === tipo && condicion(m));
      if (mensaje) {
        return mensaje;
      }
      await new Promise((resolver) => setTimeout(resolver, 20));
    }
    throw new Error(`No llegó un mensaje ${tipo}. Recibidos: ${JSON.stringify(this.recibidos.map((m) => m.tipo))}`);
  }

  async cerrar(): Promise<void> {
    const cerrado = new Promise((resolver) => this.socket.once('close', resolver));
    this.socket.close();
    await cerrado;
  }
}

describe('Flujo completo: REST + WebSockets + webhook', () => {
  let contenedor: Contenedor;
  let servidor: Server;
  let base: string;
  let urlWs: string;
  const reloj = new RelojControlable(new Date());

  async function peticion(metodo: string, ruta: string, cuerpo?: unknown, token?: string) {
    const respuesta = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    const texto = await respuesta.text();
    return { estado: respuesta.status, cuerpo: texto ? JSON.parse(texto) : null };
  }

  async function registrarEIniciarSesion(nombre: string): Promise<{ token: string; usuarioId: string }> {
    const correo = `${nombre.toLowerCase()}@correo.com`;
    await peticion('POST', '/usuarios/registro', { nombre, correo, contrasena: 'clave-123' });
    const { cuerpo } = await peticion('POST', '/usuarios/login', { correo, contrasena: 'clave-123' });
    return cuerpo;
  }

  beforeAll(async () => {
    // El servidor registra en consola cada petición y evento; aquí sobra.
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    contenedor = construirContenedor(
      {
        puerto: 0,
        jwtSecreto: 'jwt-pruebas',
        persistencia: 'sqlite',
        rutaBaseDatos: ':memory:',
        pasarelaSecreto: SECRETO_PASARELA,
      },
      reloj,
    );
    servidor = createServer(contenedor.app);
    contenedor.servidorWebSocket.conectar(servidor);
    await new Promise<void>((resolver) => servidor.listen(0, resolver));
    const { port } = servidor.address() as AddressInfo;
    base = `http://localhost:${port}`;
    urlWs = `ws://localhost:${port}/ws`;
  });

  afterAll(async () => {
    contenedor.liberar();
    await new Promise((resolver) => servidor.close(resolver));
    jest.restoreAllMocks();
  });

  test('dos postores ven la subasta en tiempo real hasta el cierre y el pago', async () => {
    const vendedor = await registrarEIniciarSesion('Vendedora');
    const ana = await registrarEIniciarSesion('Ana');
    const beto = await registrarEIniciarSesion('Beto');

    const publicada = await peticion(
      'POST',
      '/subastas',
      {
        denominacion: 'Cámara analógica',
        descripcion: 'Cámara de 35 mm',
        estadoConservacion: 'BUEN_ESTADO',
        categoriaId: 'electronica',
        precioBase: 200000,
        incrementoMinimo: 20000,
        fechaCierre: new Date(reloj.ahora().getTime() + 2 * UNA_HORA_MS).toISOString(),
      },
      vendedor.token,
    );
    expect(publicada.estado).toBe(201);
    const subastaId: string = publicada.cuerpo.id;

    // Dos clientes conectados a la misma subasta, cada uno con su sesión.
    const clienteAna = await ClientePrueba.conectar(`${urlWs}?token=${ana.token}`);
    const clienteBeto = await ClientePrueba.conectar(`${urlWs}?token=${beto.token}`);
    clienteAna.suscribir(subastaId);
    clienteBeto.suscribir(subastaId);

    const estadoInicial = await clienteAna.esperar('ESTADO_SUBASTA');
    expect(estadoInicial.datos).toMatchObject({ id: subastaId, estado: 'ABIERTA', ofertaVigente: null });
    await clienteBeto.esperar('PARTICIPANTES_CONECTADOS', (m) => m.datos?.cantidad === 2);

    // Ana puja por HTTP y ambos reciben la nueva oferta sin preguntar.
    const pujaAna = await peticion('POST', `/subastas/${subastaId}/pujas`, { monto: 200000 }, ana.token);
    expect(pujaAna.estado).toBe(201);
    await clienteBeto.esperar('NUEVA_PUJA_VIGENTE', (m) => m.datos?.ofertaVigente === 200000);
    await clienteAna.esperar('NUEVA_PUJA_VIGENTE', (m) => m.datos?.ofertaVigente === 200000);

    // Una puja insuficiente se rechaza con 4xx y no se difunde.
    const insuficiente = await peticion('POST', `/subastas/${subastaId}/pujas`, { monto: 210000 }, beto.token);
    expect(insuficiente.estado).toBe(422);
    expect(insuficiente.cuerpo.error.codigo).toBe('RN09_PUJA_INSUFICIENTE');

    const propia = await peticion('POST', `/subastas/${subastaId}/pujas`, { monto: 900000 }, vendedor.token);
    expect(propia.estado).toBe(403);
    expect(propia.cuerpo.error.codigo).toBe('RN07_VENDEDOR_NO_PUEDE_PUJAR');

    // Beto supera a Ana: todos ven la oferta y Ana recibe su aviso personal.
    await peticion('POST', `/subastas/${subastaId}/pujas`, { monto: 250000 }, beto.token);
    await clienteAna.esperar('NUEVA_PUJA_VIGENTE', (m) => m.datos?.ofertaVigente === 250000);
    const aviso = await clienteAna.esperar('AVISO', (m) => m.datos?.tipo === 'PUJA_SUPERADA');
    expect(aviso.subastaId).toBe(subastaId);
    expect(clienteBeto.recibidos.some((m) => m.tipo === 'AVISO')).toBe(false);

    // Llega la fecha de cierre: la siguiente consulta cierra y lo anuncia.
    reloj.adelantar(2 * UNA_HORA_MS);
    const detalle = await peticion('GET', `/subastas/${subastaId}`);
    expect(detalle.cuerpo.estado).toBe('ADJUDICADA');
    const cierre = await clienteAna.esperar('SUBASTA_CERRADA');
    expect(cierre.datos).toMatchObject({ estado: 'ADJUDICADA', ganadorId: beto.usuarioId, montoGanador: 250000 });
    await clienteBeto.esperar('AVISO', (m) => m.datos?.tipo === 'SUBASTA_ADJUDICADA_GANADOR');

    // RF-17: el ganador consulta su orden de pago; un tercero no puede.
    const ordenes = await peticion('GET', '/ordenes-pago', undefined, beto.token);
    expect(ordenes.cuerpo).toHaveLength(1);
    const orden = ordenes.cuerpo[0];
    expect(orden).toMatchObject({ subastaId, monto: 250000, estado: 'PENDIENTE' });
    expect((await peticion('GET', `/ordenes-pago/${orden.id}`, undefined, ana.token)).estado).toBe(403);

    // Webhook: firma inválida → 401 sin cambios.
    const cuerpo = JSON.stringify({ idEvento: 'evt-1', ordenPagoId: orden.id, resultado: 'APROBADO' });
    const invalida = await fetch(`${base}/webhooks/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pasarela-Firma': VerificadorFirmaHmac.firmar(cuerpo, 'x') },
      body: cuerpo,
    });
    expect(invalida.status).toBe(401);

    // Webhook auténtico, enviado dos veces: se aplica una sola vez.
    const enviar = () =>
      fetch(`${base}/webhooks/pagos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Pasarela-Firma': VerificadorFirmaHmac.firmar(cuerpo, SECRETO_PASARELA),
        },
        body: cuerpo,
      });
    const primera = await enviar();
    const segunda = await enviar();
    expect(primera.status).toBe(200);
    expect(segunda.status).toBe(200);
    expect(await primera.json()).toMatchObject({ estadoOrden: 'CONFIRMADA', procesadoPreviamente: false });
    expect(await segunda.json()).toMatchObject({ estadoOrden: 'CONFIRMADA', procesadoPreviamente: true });

    await clienteAna.esperar('ESTADO_SUBASTA_ACTUALIZADO', (m) => m.datos?.estado === 'PAGADA');
    expect((await peticion('GET', `/subastas/${subastaId}`)).cuerpo.estado).toBe('PAGADA');

    await clienteAna.cerrar();
    await clienteBeto.cerrar();
  });

  test('el listado cierra las subastas vencidas antes de filtrar por estado', async () => {
    const vendedor = await registrarEIniciarSesion('Carla');
    const { cuerpo } = await peticion(
      'POST',
      '/subastas',
      {
        denominacion: 'Lámpara',
        descripcion: 'Lámpara de mesa',
        estadoConservacion: 'NUEVO',
        categoriaId: 'hogar',
        precioBase: 50000,
        incrementoMinimo: 5000,
        fechaCierre: new Date(reloj.ahora().getTime() + UNA_HORA_MS).toISOString(),
      },
      vendedor.token,
    );
    reloj.adelantar(UNA_HORA_MS);

    const abiertas = await peticion('GET', '/subastas?estado=ABIERTA&categoriaId=hogar');
    const desiertas = await peticion('GET', '/subastas?estado=DESIERTA&categoriaId=hogar');

    expect(abiertas.cuerpo.subastas.map((s: { id: string }) => s.id)).not.toContain(cuerpo.id);
    expect(desiertas.cuerpo.subastas.map((s: { id: string }) => s.id)).toContain(cuerpo.id);
    expect((await peticion('GET', '/subastas?estado=VENDIDA')).estado).toBe(400);
  });

  test('una suscripción a una subasta inexistente responde con un error por WebSocket', async () => {
    const cliente = await ClientePrueba.conectar(urlWs);
    cliente.suscribir('no-existe');
    const error = await cliente.esperar('ERROR');
    expect(error.datos).toMatchObject({ codigo: 'SUBASTA_NO_ENCONTRADA' });
    await cliente.cerrar();
  });
});

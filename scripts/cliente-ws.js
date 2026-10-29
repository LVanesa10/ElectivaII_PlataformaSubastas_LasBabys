// Cliente de consola para observar el tiempo real sin la aplicación web.
//
// Uso:
//   npm run ws -- <subastaId> [token]
//
// Abra dos terminales con este cliente sobre la misma subasta y puje desde
// la API: ambos verán la nueva oferta al instante; quien sea superado
// recibirá además un AVISO personal (si se conectó con su token).
require('dotenv/config');
const WebSocket = require('ws');

const [subastaId, token] = process.argv.slice(2);
if (!subastaId) {
  console.error('Uso: npm run ws -- <subastaId> [token]');
  process.exit(1);
}

const base = process.env.URL_WS ?? `ws://localhost:${process.env.PUERTO ?? 3000}/ws`;
const socket = new WebSocket(token ? `${base}?token=${encodeURIComponent(token)}` : base);

socket.on('open', () => {
  socket.send(JSON.stringify({ accion: 'SUSCRIBIR', subastaId }));
});
socket.on('message', (datos) => {
  const mensaje = JSON.parse(datos.toString());
  console.log(`[${mensaje.fecha}] ${mensaje.tipo}`, JSON.stringify(mensaje.datos ?? {}, null, 2));
});
socket.on('close', () => console.log('Conexión cerrada.'));
socket.on('error', (error) => console.error('Error de conexión:', error.message));

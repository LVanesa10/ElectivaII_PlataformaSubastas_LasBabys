import { createServer } from 'http';
import { leerConfiguracion } from '../config/entorno';
import { construirContenedor } from '../contenedor';
import { RUTA_WEBSOCKET } from '../tiempo-real/ServidorWebSocket';

const configuracion = leerConfiguracion();
const contenedor = construirContenedor(configuracion);

// El mismo servidor HTTP atiende la API REST y las conexiones de WebSocket.
const servidorHttp = createServer(contenedor.app);
contenedor.servidorWebSocket.conectar(servidorHttp);

servidorHttp.listen(configuracion.puerto, () => {
  console.log(`API REST en http://localhost:${configuracion.puerto}`);
  console.log(`WebSockets en ws://localhost:${configuracion.puerto}${RUTA_WEBSOCKET}`);
  console.log(`Documentación en http://localhost:${configuracion.puerto}/api-docs`);
  console.log(`Persistencia: ${configuracion.persistencia}`);
});

process.on('unhandledRejection', (motivo) => {
  console.error(`[${new Date().toISOString()}] [promesa-no-controlada]`, motivo);
});

function apagar(): void {
  servidorHttp.close();
  contenedor.liberar();
  process.exit(0);
}
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);

import { Express } from 'express';
import { Configuracion } from './config/entorno';
import { abrirBaseDatosSqlite, ConexionSqlite } from './persistencia/sqlite/BaseDatosSqlite';
import { SubastaRepositorioSqlite } from './persistencia/sqlite/SubastaRepositorioSqlite';
import { UsuarioRepositorioSqlite } from './persistencia/sqlite/UsuarioRepositorioSqlite';
import { CategoriaRepositorioSqlite } from './persistencia/sqlite/CategoriaRepositorioSqlite';
import { NotificacionRepositorioSqlite } from './persistencia/sqlite/NotificacionRepositorioSqlite';
import { EventoPagoRepositorioSqlite } from './persistencia/sqlite/EventoPagoRepositorioSqlite';
import { SubastaRepositorioMemoria } from './persistencia/memoria/SubastaRepositorioMemoria';
import { UsuarioRepositorioMemoria } from './persistencia/memoria/UsuarioRepositorioMemoria';
import { CategoriaRepositorioMemoria } from './persistencia/memoria/CategoriaRepositorioMemoria';
import { NotificacionRepositorioMemoria } from './persistencia/memoria/NotificacionRepositorioMemoria';
import { EventoPagoRepositorioMemoria } from './persistencia/memoria/EventoPagoRepositorioMemoria';
import { RelojDelSistema } from './servicios/RelojDelSistema';
import { HasheadorBcrypt } from './servicios/HasheadorBcrypt';
import { GeneradorTokenJwt } from './servicios/GeneradorTokenJwt';
import { VerificadorFirmaHmac } from './servicios/VerificadorFirmaHmac';
import { NotificadorConsola } from './servicios/NotificadorConsola';
import { NotificadorAvisosPersonales } from './servicios/NotificadorAvisosPersonales';
import { NotificadorCompuesto } from './servicios/NotificadorCompuesto';
import { RegistroConexiones } from './tiempo-real/RegistroConexiones';
import { DifusorWebSocket } from './tiempo-real/DifusorWebSocket';
import { ServidorWebSocket } from './tiempo-real/ServidorWebSocket';
import { crearAplicacion } from './http/app';
import { UsuariosController } from './http/controladores/UsuariosController';
import { SubastasController } from './http/controladores/SubastasController';
import { PujasController } from './http/controladores/PujasController';
import { OrdenesPagoController } from './http/controladores/OrdenesPagoController';
import { WebhooksController } from './http/controladores/WebhooksController';

import { SubastaRepositorio } from '../aplicacion/puertos/SubastaRepositorio';
import { UsuarioRepositorio } from '../aplicacion/puertos/UsuarioRepositorio';
import { CategoriaRepositorio } from '../aplicacion/puertos/CategoriaRepositorio';
import { NotificacionRepositorio } from '../aplicacion/puertos/NotificacionRepositorio';
import { EventoPagoRepositorio } from '../aplicacion/puertos/EventoPagoRepositorio';
import { Reloj } from '../aplicacion/puertos/Reloj';
import { RegistrarUsuario } from '../aplicacion/casos-uso/RegistrarUsuario';
import { IniciarSesion } from '../aplicacion/casos-uso/IniciarSesion';
import { ConsultarPerfil } from '../aplicacion/casos-uso/ConsultarPerfil';
import { ConsultarNotificaciones } from '../aplicacion/casos-uso/ConsultarNotificaciones';
import { PublicarSubasta } from '../aplicacion/casos-uso/PublicarSubasta';
import { ListarSubastas } from '../aplicacion/casos-uso/ListarSubastas';
import { ConsultarSubasta } from '../aplicacion/casos-uso/ConsultarSubasta';
import { CancelarSubasta } from '../aplicacion/casos-uso/CancelarSubasta';
import { RegistrarPuja } from '../aplicacion/casos-uso/RegistrarPuja';
import { ConsultarOrdenesPago } from '../aplicacion/casos-uso/ConsultarOrdenesPago';
import { ProcesarNotificacionPago } from '../aplicacion/casos-uso/ProcesarNotificacionPago';

interface Repositorios {
  subastas: SubastaRepositorio;
  usuarios: UsuarioRepositorio;
  categorias: CategoriaRepositorio;
  notificaciones: NotificacionRepositorio;
  eventosPago: EventoPagoRepositorio;
}

export interface Contenedor {
  app: Express;
  servidorWebSocket: ServidorWebSocket;
  liberar(): void;
}

// Sustituir la persistencia es elegir otro conjunto de adaptadores aquí: ni
// el dominio ni los casos de uso cambian (RNF-06).
function crearRepositorios(configuracion: Configuracion): { repositorios: Repositorios; bd: ConexionSqlite | null } {
  if (configuracion.persistencia === 'memoria') {
    return {
      bd: null,
      repositorios: {
        subastas: new SubastaRepositorioMemoria(),
        usuarios: new UsuarioRepositorioMemoria(),
        categorias: new CategoriaRepositorioMemoria(),
        notificaciones: new NotificacionRepositorioMemoria(),
        eventosPago: new EventoPagoRepositorioMemoria(),
      },
    };
  }

  const bd = abrirBaseDatosSqlite(configuracion.rutaBaseDatos);
  return {
    bd,
    repositorios: {
      subastas: new SubastaRepositorioSqlite(bd),
      usuarios: new UsuarioRepositorioSqlite(bd),
      categorias: new CategoriaRepositorioSqlite(bd),
      notificaciones: new NotificacionRepositorioSqlite(bd),
      eventosPago: new EventoPagoRepositorioSqlite(bd),
    },
  };
}

// Raíz de composición: el único lugar que conoce todas las piezas concretas.
export function construirContenedor(configuracion: Configuracion, reloj: Reloj = new RelojDelSistema()): Contenedor {
  const { repositorios, bd } = crearRepositorios(configuracion);

  const hasheador = new HasheadorBcrypt();
  const tokens = new GeneradorTokenJwt(configuracion.jwtSecreto);
  const verificadorPagos = new VerificadorFirmaHmac(configuracion.pasarelaSecreto);

  const registroConexiones = new RegistroConexiones();
  const difusorWebSocket = new DifusorWebSocket(registroConexiones);
  const notificador = new NotificadorCompuesto([
    new NotificadorConsola(),
    new NotificadorAvisosPersonales(repositorios.notificaciones, reloj, difusorWebSocket),
    difusorWebSocket,
  ]);

  const consultarSubasta = new ConsultarSubasta(repositorios.subastas, reloj, notificador);

  const usuarios = new UsuariosController(
    new RegistrarUsuario(repositorios.usuarios, hasheador),
    new IniciarSesion(repositorios.usuarios, hasheador, tokens),
    new ConsultarPerfil(repositorios.usuarios, repositorios.subastas),
    new ConsultarNotificaciones(repositorios.usuarios, repositorios.notificaciones),
  );
  const subastas = new SubastasController(
    new PublicarSubasta(repositorios.subastas, repositorios.usuarios, repositorios.categorias, reloj),
    new ListarSubastas(repositorios.subastas, reloj, notificador),
    consultarSubasta,
    new CancelarSubasta(repositorios.subastas, reloj, notificador),
  );
  const pujas = new PujasController(new RegistrarPuja(repositorios.subastas, reloj, notificador));
  const ordenesPago = new OrdenesPagoController(new ConsultarOrdenesPago(repositorios.subastas, reloj, notificador));
  const webhooks = new WebhooksController(
    new ProcesarNotificacionPago(verificadorPagos, repositorios.eventosPago, repositorios.subastas, reloj, notificador),
  );

  const app = crearAplicacion({
    usuarios,
    subastas,
    pujas,
    ordenesPago,
    webhooks,
    categorias: repositorios.categorias,
    tokens,
  });
  const servidorWebSocket = new ServidorWebSocket(registroConexiones, difusorWebSocket, consultarSubasta, tokens);

  return {
    app,
    servidorWebSocket,
    liberar: () => {
      servidorWebSocket.cerrar();
      bd?.close();
    },
  };
}

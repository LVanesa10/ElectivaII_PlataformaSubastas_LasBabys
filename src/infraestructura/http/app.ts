import fs from 'fs';
import path from 'path';
import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { CategoriaRepositorio } from '../../aplicacion/puertos/CategoriaRepositorio';
import { GeneradorToken } from '../../aplicacion/puertos/GeneradorToken';
import { UsuariosController } from './controladores/UsuariosController';
import { SubastasController } from './controladores/SubastasController';
import { PujasController } from './controladores/PujasController';
import { OrdenesPagoController } from './controladores/OrdenesPagoController';
import { WebhooksController } from './controladores/WebhooksController';
import { crearRutasUsuarios } from './rutas/usuarios.routes';
import { crearRutasSubastas } from './rutas/subastas.routes';
import { crearRutasOrdenesPago } from './rutas/ordenesPago.routes';
import { crearRutasWebhooks } from './rutas/webhooks.routes';
import { manejoErrores } from './middlewares/manejoErrores';
import { registroPeticiones } from './middlewares/registroPeticiones';
import { presentarCategoria } from './presentadores';

const RUTA_ESPECIFICACION_OPENAPI = path.resolve(__dirname, '../../../docs/openapi.yaml');

export interface DependenciasHttp {
  usuarios: UsuariosController;
  subastas: SubastasController;
  pujas: PujasController;
  ordenesPago: OrdenesPagoController;
  webhooks: WebhooksController;
  categorias: CategoriaRepositorio;
  tokens: GeneradorToken;
}

// Adaptador de entrada HTTP: solo arma rutas y middlewares. Las instancias
// concretas se crean en el contenedor de dependencias.
export function crearAplicacion(dependencias: DependenciasHttp): Express {
  const app = express();
  app.use(registroPeticiones);

  // El webhook va antes del analizador JSON global: necesita el cuerpo
  // original, sin interpretar, para verificar la firma.
  app.use('/webhooks', crearRutasWebhooks(dependencias.webhooks));

  app.use(express.json());

  const especificacion = YAML.parse(fs.readFileSync(RUTA_ESPECIFICACION_OPENAPI, 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(especificacion));
  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(especificacion);
  });

  app.get('/salud', (_req, res) => {
    res.status(200).json({ estado: 'ok' });
  });

  app.get('/categorias', async (_req, res, next) => {
    try {
      const categorias = await dependencias.categorias.listarTodas();
      res.status(200).json(categorias.map(presentarCategoria));
    } catch (error) {
      next(error);
    }
  });

  app.use('/usuarios', crearRutasUsuarios(dependencias.usuarios, dependencias.tokens));
  app.use('/subastas', crearRutasSubastas(dependencias.subastas, dependencias.pujas, dependencias.tokens));
  app.use('/ordenes-pago', crearRutasOrdenesPago(dependencias.ordenesPago, dependencias.tokens));

  app.use((_req, res) => {
    res.status(404).json({ error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: 'El recurso solicitado no existe.' } });
  });

  // El middleware de manejo de errores siempre se registra al final.
  app.use(manejoErrores);

  return app;
}

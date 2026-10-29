# ElectivaII_PlataformaSubastas_LasBabys

Nombre de la materia: Electiva II

Nombre del proyecto: Plataforma de Subastas en Línea

Equipo: LasBabys

Integrantes:
Laura Vanessa Vanegas Hoyos
Sara Jaramillo Florez
Luis Fernando Parra Rodriguez

Descripción: API REST y de WebSockets para una plataforma de subastas en línea,
construida con arquitectura hexagonal y diseño guiado por el dominio (DDD). Un
vendedor publica un artículo con precio base y fecha de cierre; los demás
usuarios pujan y ven las ofertas en tiempo real hasta que la subasta cierra, se
adjudica al mejor postor y se genera la orden de pago, que la pasarela externa
confirma mediante un webhook.

**Estado: Entrega 2 — API completa con comunicación en tiempo real.**

Requerimientos:
- Node.js 20 o superior (probado con Node 22)
- TypeScript (modo estricto)
- Express.js
- SQLite mediante `better-sqlite3` (incluido como dependencia; no requiere instalar ningún servidor)
- `ws` para WebSockets
- JSON Web Tokens (`jsonwebtoken`) para autenticación
- bcrypt (`bcryptjs`) para el cifrado de contraseñas
- Jest y ts-jest para las pruebas

Licencia: No tiene

## Puesta en marcha local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo de entorno y completar los secretos:

   ```bash
   cp .env.example .env
   ```

   Edite `.env` y asigne un valor propio a `JWT_SECRETO` y a `PASARELA_SECRETO`.
   El servidor no arranca si falta `JWT_SECRETO`.

3. Compilar y ejecutar:

   ```bash
   npm run build
   npm start
   ```

   El servidor muestra al arrancar:

   ```
   API REST en http://localhost:3000
   WebSockets en ws://localhost:3000/ws
   Documentación en http://localhost:3000/api-docs
   Persistencia: sqlite
   ```

Para desarrollo con recarga automática:

```bash
npm run dev
```

La base de datos SQLite se crea sola en `./datos/subastas.db` la primera vez
(carpeta excluida del repositorio). Para empezar de cero basta con borrar esa
carpeta.

### Variables de entorno

| Variable           | Obligatoria | Por defecto           | Descripción |
|--------------------|:-----------:|-----------------------|-------------|
| `PUERTO`           | No          | `3000`                | Puerto HTTP y de WebSockets |
| `JWT_SECRETO`      | **Sí**      | —                     | Secreto para firmar los tokens de sesión |
| `PERSISTENCIA`     | No          | `sqlite`              | `sqlite` o `memoria` |
| `RUTA_BASE_DATOS`  | No          | `./datos/subastas.db` | Archivo de SQLite |
| `PASARELA_SECRETO` | Para el webhook | —                 | Secreto compartido con la pasarela para firmar las notificaciones de pago. Si está vacío, toda notificación se rechaza |

## Pruebas

```bash
npm test
```

| Carpeta              | Qué cubre |
|----------------------|-----------|
| `test/dominio/`      | Reglas de negocio: publicación, aceptación y rechazo de pujas, cierre, adjudicación, orden de pago, vencimiento (RN-20) y objetos de valor |
| `test/aplicacion/`   | Caso de uso del webhook: verificación de origen (RN-18), idempotencia (RN-19) y aplicación del resultado (RN-17) |
| `test/infraestructura/` | Adaptador SQLite: el agregado se guarda y se rehidrata completo y las reglas siguen aplicándose |
| `test/integracion/`  | Servidor real con SQLite: dos clientes WebSocket siguen una subasta, pujan, la ven cerrar y el pago se confirma por webhook |

También puede verificarse el tipado completo con `npm run typecheck`.

## Demostración del tiempo real (sustentación)

1. Arranque el servidor (`npm start`) y abra `http://localhost:3000/api-docs`.
2. Registre tres usuarios (`POST /usuarios/registro`) e inicie sesión con cada
   uno (`POST /usuarios/login`) para obtener sus tokens.
3. Con el token del vendedor publique una subasta (`POST /subastas`).
4. En dos terminales, conecte a los dos postores a esa subasta:

   ```bash
   npm run ws -- <subastaId> <token-postor-1>
   ```

   ```bash
   npm run ws -- <subastaId> <token-postor-2>
   ```

5. Puje con cada postor (`POST /subastas/{id}/pujas`). Ambas terminales
   reciben `NUEVA_PUJA_VIGENTE` al instante y el superado recibe un `AVISO`.
6. Al llegar la fecha de cierre, la siguiente consulta, listado o puja cierra
   la subasta y ambas terminales reciben `SUBASTA_CERRADA` con el ganador.
7. Con el token del ganador consulte `GET /ordenes-pago` y simule la pasarela:

   ```bash
   npm run pasarela -- <ordenPagoId> APROBADO evt-001
   ```

   Repetir el mismo comando demuestra la idempotencia (`procesadoPreviamente: true`);
   añadir `--firma-invalida` demuestra el rechazo por origen no verificable (401).

El protocolo de mensajes está documentado en [`docs/websockets.md`](docs/websockets.md).

## Estructura de carpetas y su correspondencia con las capas

```
src/
├── dominio/                     # Núcleo del negocio. No importa Express, ws,
│   │                            # SQLite, JWT, bcrypt ni nada de infraestructura.
│   ├── objetos-valor/           # Conceptos sin identidad, inmutables y autovalidados.
│   │   ├── Dinero.ts            # RN-21
│   │   ├── Email.ts
│   │   ├── EstadoSubasta.ts     # ABIERTA, CANCELADA, DESIERTA, ADJUDICADA, PAGADA, INCUMPLIDA
│   │   ├── PeriodoSubasta.ts    # RN-02, RN-03
│   │   └── Articulo.ts
│   ├── entidades/               # Conceptos con identidad propia.
│   │   ├── Subasta.ts           # Raíz del agregado. Concentra las reglas.
│   │   ├── Puja.ts              # Interna al agregado; inmutable (RN-11).
│   │   ├── IntentoPujaRechazado.ts
│   │   ├── OrdenPago.ts         # Interna al agregado; plazo de 48 h.
│   │   ├── EventoPago.ts        # Notificación de la pasarela ya procesada.
│   │   ├── Usuario.ts
│   │   ├── Categoria.ts
│   │   └── Notificacion.ts      # Aviso personal derivado de un EventoDeDominio.
│   ├── eventos/
│   │   └── EventoDeDominio.ts   # Hechos que la Subasta anuncia.
│   └── errores/
│       └── ErrorDeDominio.ts    # Un error por regla, con código identificable.
│
├── aplicacion/                  # Orquesta el dominio; sin reglas propias.
│   ├── puertos/                 # Interfaces hacia el exterior.
│   │   ├── SubastaRepositorio.ts, UsuarioRepositorio.ts, CategoriaRepositorio.ts,
│   │   ├── NotificacionRepositorio.ts, EventoPagoRepositorio.ts
│   │   ├── NotificadorDeEventos.ts   # Puerto de salida del tiempo real (RNF-05)
│   │   ├── VerificadorOrigenPagos.ts # Puerto de verificación del webhook (RN-18)
│   │   └── Reloj.ts, HasheadorContrasenas.ts, GeneradorToken.ts
│   ├── servicios/
│   │   └── persistirYAnunciar.ts     # Guarda la subasta y publica sus eventos.
│   └── casos-uso/
│       ├── RegistrarUsuario.ts, IniciarSesion.ts, ConsultarPerfil.ts, ConsultarNotificaciones.ts
│       ├── PublicarSubasta.ts, ListarSubastas.ts, ConsultarSubasta.ts, CancelarSubasta.ts
│       ├── RegistrarPuja.ts
│       ├── ConsultarOrdenesPago.ts       # RF-17
│       └── ProcesarNotificacionPago.ts   # Webhook: RN-17, RN-18, RN-19
│
└── infraestructura/             # Adaptadores concretos y tecnología.
    ├── contenedor.ts            # Raíz de composición: crea e inyecta todo.
    ├── config/
    │   └── entorno.ts           # Lee las variables de entorno (RNF-10).
    ├── http/                    # Adaptador de entrada: API REST.
    │   ├── servidor.ts          # Punto de entrada: HTTP + WebSockets en el mismo puerto.
    │   ├── app.ts               # Rutas, middlewares y Swagger UI.
    │   ├── presentadores.ts     # Entidades de dominio a JSON (sin datos de contacto, RN-23).
    │   ├── controladores/       # Reciben la petición y delegan. Sin reglas de negocio.
    │   ├── rutas/               # Rutas agrupadas por recurso.
    │   └── middlewares/
    │       ├── autenticacion.ts
    │       ├── validacion.ts    # Solo formato de entrada.
    │       ├── registroPeticiones.ts # Log de cada petición (RNF-17).
    │       └── manejoErrores.ts # Código de error de dominio → estado HTTP.
    ├── tiempo-real/             # Adaptadores de WebSockets (única carpeta que importa "ws").
    │   ├── ServidorWebSocket.ts # Entrada: conexiones y suscripciones.
    │   ├── DifusorWebSocket.ts  # Salida: implementa NotificadorDeEventos.
    │   ├── RegistroConexiones.ts
    │   └── mensajes.ts          # Contrato de mensajes y traducción de eventos.
    ├── persistencia/
    │   ├── sqlite/              # Adaptador de salida definitivo.
    │   └── memoria/             # Adaptador alternativo (PERSISTENCIA=memoria).
    └── servicios/               # Otros adaptadores de salida.
        ├── RelojDelSistema.ts, HasheadorBcrypt.ts, GeneradorTokenJwt.ts
        ├── VerificadorFirmaHmac.ts        # Firma HMAC-SHA256 del webhook.
        ├── NotificadorConsola.ts          # Log de eventos de negocio.
        ├── NotificadorAvisosPersonales.ts # Persiste y entrega los avisos.
        └── NotificadorCompuesto.ts        # Reparte un evento entre varios adaptadores.

scripts/
├── simular-pasarela.js          # Emisor propio que simula la pasarela de pagos.
└── cliente-ws.js                # Cliente de consola para observar el tiempo real.

test/                            # Ver la sección «Pruebas».

docs/
├── openapi.yaml                 # Especificación OpenAPI 3.0 (servida en /api-docs).
└── websockets.md                # Contrato de la API de WebSockets.
```

### Persistencia: por qué SQLite (RNF-11)

- Es una base de datos relacional real, con transacciones, claves foráneas y
  restricciones `UNIQUE` y `CHECK`, pero vive en un archivo: quien clone el
  repositorio la ejecuta sin instalar ni configurar un servidor (RNF-18).
- El proyecto corre en un único proceso, que es justo el escenario de SQLite.
- El repositorio respeta la frontera del agregado: la subasta, sus pujas, sus
  intentos rechazados y su orden de pago se guardan en tablas separadas pero en
  **una sola transacción**, y se leen siempre juntas.
- Sustituirla no toca el dominio ni la aplicación (RNF-06): el adaptador en
  memoria de la Entrega 1 sigue disponible con `PERSISTENCIA=memoria`, y el
  cambio se decide únicamente en `src/infraestructura/contenedor.ts`.

### Consistencia de las pujas

La consistencia se garantiza en el modelo de dominio, como pide el enunciado:
el agregado `Subasta` valida cada puja contra su propio estado. Como la
aplicación corre en un solo proceso y el controlador de SQLite es síncrono,
cada caso de uso lee, decide y guarda la subasta sin ceder el control a otra
petición entre esos pasos, por lo que dos pujas simultáneas nunca se validan
contra el mismo estado.

## Estrategia de ramas

- `main`: rama estable. Siempre debe quedar en estado ejecutable (compila,
  arranca y las pruebas pasan). No se hacen confirmaciones directas sobre
  `main` salvo la inicialización del repositorio.
- `develop`: rama de integración donde se unen las funcionalidades antes de
  promoverse a `main` en cada entrega.
- `feature/<descripcion-corta>`: una rama por unidad de trabajo (por ejemplo
  `feature/dominio-subasta`, `feature/rutas-pujas`). Se abre desde `develop` y
  se integra de vuelta mediante *pull request* revisado por otro integrante.
- `fix/<descripcion-corta>`: correcciones puntuales, con el mismo flujo.

Cada rama se integra con *pull request*; no se hace *merge* de una rama sin
revisión de al menos otro integrante del equipo.

## Convención de mensajes de confirmación

Se sigue [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<alcance opcional>): <descripción en imperativo, sin punto final>
```

Tipos usados: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

Ejemplos reales del historial:

```
feat(dominio): agrega la regla RN-09 de incremento mínimo en Subasta
test(dominio): cubre el cierre desierto y la adjudicación
docs(repo): documenta la correspondencia carpetas ↔ capas hexagonales
```

No se admiten mensajes genéricos como «cambios», «arreglo» o «actualización».

## Documentación de la API

- **REST:** la especificación OpenAPI 3.0 está en [`docs/openapi.yaml`](docs/openapi.yaml)
  y el propio servidor la sirve como documentación interactiva en
  <http://localhost:3000/api-docs> (desde ahí se puede probar cada endpoint con
  el botón *Authorize* para el token). Describe cada recurso, sus parámetros,
  los cuerpos de petición y todos los códigos de estado de respuesta.
- **WebSockets:** el contrato de mensajes está en [`docs/websockets.md`](docs/websockets.md).

## Dónde se hace cumplir cada regla de negocio

Las reglas viven en la capa de dominio, no en los controladores. Cada
violación lanza una subclase de `ErrorDeDominio` cuyo código identifica la
regla incumplida. El código de cada `ErrorDeDominio` empieza por el número de
regla (por ejemplo `RN09_PUJA_INSUFICIENTE`), lo que permite rastrearla desde
el error hasta el punto exacto donde se aplica.

| Regla | Dónde se aplica |
|-------|-----------------|
| RN-01 | `Subasta.publicar()` — validación de precio base e incremento |
| RN-02, RN-03 | `PeriodoSubasta.crear()` — fecha de cierre y duración |
| RN-04, RN-05 | `Subasta.cancelar()` |
| RN-06 | `Subasta.validarPuja()` — estado abierto |
| RN-07 | `Subasta.validarPuja()` — vendedor no puede pujar |
| RN-08 | `Subasta.validarPuja()` — primera puja ≥ precio base |
| RN-09 | `Subasta.validarPuja()` — incremento mínimo sobre la oferta vigente |
| RN-10 | `Subasta.validarPuja()` — el mejor postor no se supera a sí mismo |
| RN-11 | `Puja` — sin métodos de mutación tras crearse |
| RN-12 | `Subasta.registrarPuja()` → `registrarIntentoFallido()` |
| RN-13, RN-14, RN-15, RN-16 | `Subasta.cerrar()` (invocada desde `Subasta.sincronizar()`); la orden nace en `OrdenPago.generar()` con su plazo de 48 h |
| RN-17 | `Subasta.registrarResultadoPago()` → `OrdenPago.confirmar()`; solo se alcanza desde `ProcesarNotificacionPago` |
| RN-18 | `ProcesarNotificacionPago.ejecutar()` (primer paso) con el puerto `VerificadorOrigenPagos` → `VerificadorFirmaHmac` |
| RN-19 | `ProcesarNotificacionPago.ejecutar()` (segundo paso) con `EventoPagoRepositorio.buscarPorIdExterno()` |
| RN-20 | `Subasta.verificarVencimientoPago()` → `OrdenPago.vencerSiCorresponde()` |
| RN-21 | `Dinero.pesos()` |
| RN-22 | formato en `Email.crear()`, unicidad en `RegistrarUsuario` |
| RN-23 | `presentadores.ts` — no expone datos de contacto |

Los controladores HTTP (`src/infraestructura/http/controladores/`) no
contienen ningún `if` de negocio: leen la petición, llaman al caso de uso y
devuelven la respuesta.

**Cierre perezoso.** No hay procesos en segundo plano. `Subasta.sincronizar(ahora)`
se invoca antes de consultar, listar, pujar, cancelar o procesar un pago: si la
fecha de cierre pasó, cierra (RN-13 a RN-16); si el plazo de la orden pasó,
la declara vencida (RN-20). El listado primero sincroniza las subastas con el
plazo cumplido y luego filtra, para que una subasta vencida no aparezca como
abierta.

## Endpoints disponibles

| Método | Ruta                     | Autenticado | Descripción                                    |
|--------|--------------------------|:-----------:|-------------------------------------------------|
| GET    | /salud                   | No          | Verificación de vida del servicio               |
| GET    | /api-docs                | No          | Documentación interactiva (Swagger UI)          |
| GET    | /openapi.json            | No          | Especificación OpenAPI en JSON                  |
| GET    | /categorias              | No          | Catálogo de categorías                          |
| POST   | /usuarios/registro       | No          | Registro de un usuario                           |
| POST   | /usuarios/login          | No          | Inicio de sesión, devuelve el token             |
| GET    | /usuarios/perfil         | Sí          | Perfil, subastas publicadas y en las que participa |
| GET    | /usuarios/notificaciones | Sí          | Avisos dirigidos al usuario autenticado         |
| GET    | /subastas                | No          | Listado con filtros `categoriaId`, `estado`, `pagina`, `tamanoPagina` |
| GET    | /subastas/:id            | No          | Detalle e historial de pujas                     |
| POST   | /subastas                | Sí          | Publicar una subasta                             |
| DELETE | /subastas/:id            | Sí          | Cancelar una subasta sin pujas                   |
| POST   | /subastas/:id/pujas      | Sí          | Registrar una puja                               |
| GET    | /ordenes-pago            | Sí          | Órdenes de pago del usuario como ganador         |
| GET    | /ordenes-pago/:id        | Sí          | Detalle de una orden (ganador o vendedor)        |
| POST   | /webhooks/pagos          | Firma HMAC  | Notificación de la pasarela de pagos             |
| WS     | /ws?token=...            | Opcional    | Suscripción en tiempo real ([docs/websockets.md](docs/websockets.md)) |

La autenticación usa un token portador JWT: `Authorization: Bearer <token>`,
obtenido en la respuesta de `/usuarios/login`.

### Webhook de pagos

La pasarela envía `POST /webhooks/pagos` con el cuerpo
`{"idEvento":"evt_1","ordenPagoId":"…","resultado":"APROBADO"|"RECHAZADO"}` y el
encabezado `X-Pasarela-Firma: sha256=<HMAC-SHA256 del cuerpo con PASARELA_SECRETO>`.

1. **Origen (RN-18):** si la firma falta o no coincide → `401`, sin efecto alguno.
2. **Idempotencia (RN-19):** si `idEvento` ya se procesó → `200` con la misma
   respuesta de la primera vez y `procesadoPreviamente: true`.
3. **Aplicación (RN-17):** `APROBADO` deja la orden `CONFIRMADA` y la subasta
   `PAGADA`; `RECHAZADO` deja la orden pendiente hasta su vencimiento. Un pago que
   llega con la orden ya vencida se rechaza con `409`.

`npm run pasarela -- <ordenPagoId> <APROBADO|RECHAZADO> [idEvento] [--firma-invalida]`
simula a la pasarela firmando con el secreto del `.env`.

### Formato de errores

Todos los errores tienen la forma `{"error":{"codigo":"…","mensaje":"…"}}`. El
código de un error de negocio empieza por la regla incumplida. Una puja
rechazada nunca responde con un código de éxito: `403` (RN-07), `409` (RN-06,
RN-10) o `422` (RN-08, RN-09).

## Eventos, notificaciones y tiempo real

`EventoDeDominio` describe un hecho ocurrido en la subasta como agregado.
Los casos de uso los recogen con `extraerEventosPendientes()` y los entregan al
puerto `NotificadorDeEventos`, sin saber qué hay detrás. En
`contenedor.ts` ese puerto se conecta a un `NotificadorCompuesto` con tres
adaptadores independientes:

| Adaptador                     | Qué hace con cada evento |
|-------------------------------|--------------------------|
| `NotificadorConsola`          | Lo registra en consola (RNF-17). |
| `NotificadorAvisosPersonales` | Pide al dominio (`Notificacion.desdeEvento()`) los avisos personales que corresponden, los guarda y los entrega en el momento a las conexiones del destinatario. |
| `DifusorWebSocket`            | Lo traduce a un mensaje y lo difunde a todos los suscritos de esa subasta. |

`Notificacion` es distinta de `EventoDeDominio`: es el aviso ya dirigido a un
destinatario concreto. Una subasta adjudicada genera dos (ganador y vendedor),
una puja superada genera uno (para el superado) y una nueva puja vigente
ninguno, porque es información pública que ya llega por difusión.

## Qué queda para la siguiente entrega

- Aplicación web cliente que consuma la API, conserve la sesión y se actualice
  en tiempo real con la conexión de WebSocket.

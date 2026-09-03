# ElectivaII_PlataformaSubastas_LasBabys

Nombre de la materia: Electiva II

Nombre del proyecto: Plataforma de Subastas en Línea

Equipo: LasBabys

Integrantes:
Laura Vanessa Vanegas Hoyos
Sara Jaramillo Florez

Descripción: API REST para una plataforma de subastas en línea, construida con arquitectura hexagonal y diseño guiado por el dominio (DDD). Un vendedor publica un artículo con precio base y fecha de cierre; los demás usuarios pujan hasta que la subasta cierra y se adjudica al mejor postor. 
Esta entrega cubre el modelado del dominio y los recursos de la API.

Requerimientos:
Node.js 18
TypeScript
Express.js
JSON Web Tokens (`jsonwebtoken`) para autenticación
bcrypt para el cifrado de contraseñas
Jest y ts-jest para las pruebas unitarias
 No requiere base de datos: la persistencia de esta entrega es en memoria

Licencia: No tiene

## Puesta en marcha local

Requisitos: Node.js 18 o superior.

```bash
npm install
cp .env.example .env      # y complete JWT_SECRETO con un valor propio
npm run build
npm start                 # sirve en http://localhost:3000
```

Para desarrollo con recarga automática:

```bash
npm run dev
```

Para ejecutar las pruebas unitarias del dominio:

```bash
npm test
```

No se requiere base de datos: la persistencia de esta entrega es en
memoria y se reinicia cada vez que el proceso se detiene.

## Estructura de carpetas y su correspondencia con las capas

```
src/
├── dominio/                     # Núcleo del negocio. No importa Express, JWT,
│   │                            # bcrypt, uuid ni nada de infraestructura.
│   ├── objetos-valor/           # Conceptos sin identidad, inmutables y
│   │   │                        # autovalidados.
│   │   ├── Dinero.ts
│   │   ├── Email.ts
│   │   ├── EstadoSubasta.ts
│   │   ├── PeriodoSubasta.ts
│   │   └── Articulo.ts
│   ├── entidades/               # Conceptos con identidad propia.
│   │   ├── Subasta.ts           # Raíz del agregado. Concentra las reglas.
│   │   ├── Usuario.ts
│   │   ├── Categoria.ts
│   │   ├── Puja.ts
│   │   ├── IntentoPujaRechazado.ts
│   │   ├── OrdenPago.ts
│   │   ├── EventoPago.ts
│   │   └── Notificacion.ts      # Aviso a un destinatario, derivado de un EventoDeDominio.
│   ├── eventos/
│   │   └── EventoDeDominio.ts
│   └── errores/
│       └── ErrorDeDominio.ts    # Un error por regla, con código identificable.
│
├── aplicacion/                  # Orquesta el dominio; sin reglas propias.
│   ├── puertos/                 # Interfaces hacia el exterior. Infraestructura
│   │   │                        # las implementa; el dominio no las conoce.
│   │   ├── SubastaRepositorio.ts
│   │   ├── UsuarioRepositorio.ts
│   │   ├── CategoriaRepositorio.ts
│   │   ├── Reloj.ts
│   │   ├── HasheadorContrasenas.ts
│   │   ├── GeneradorToken.ts
│   │   ├── NotificadorDeEventos.ts
│   │   └── NotificacionRepositorio.ts
│   └── casos-uso/               # Reciben los puertos por constructor y
│       │                        # delegan la decisión de negocio al dominio.
│       ├── RegistrarUsuario.ts
│       ├── IniciarSesion.ts
│       ├── ConsultarPerfil.ts
│       ├── ConsultarNotificaciones.ts
│       ├── PublicarSubasta.ts
│       ├── ListarSubastas.ts
│       ├── ConsultarSubasta.ts
│       ├── CancelarSubasta.ts
│       └── RegistrarPuja.ts
│
└── infraestructura/             # Adaptadores concretos y tecnología.
    ├── http/                    # Adaptador de entrada: API REST.
    │   ├── app.ts               # Composición e inyección de dependencias.
    │   ├── servidor.ts          # Punto de entrada.
    │   ├── presentadores.ts     # Entidades de dominio a JSON.
    │   ├── envolverAsync.ts
    │   ├── controladores/       # Reciben la petición y delegan.
    │   ├── rutas/               # Rutas agrupadas por recurso.
    │   └── middlewares/
    │       ├── autenticacion.ts
    │       ├── validacion.ts    # Solo formato de entrada.
    │       └── manejoErrores.ts # Código de error de dominio a estado HTTP.
    │
    ├── persistencia/memoria/    # Adaptador de salida: repositorios en memoria.
    │   ├── SubastaRepositorioMemoria.ts
    │   ├── UsuarioRepositorioMemoria.ts
    │   ├── CategoriaRepositorioMemoria.ts
    │   └── NotificacionRepositorioMemoria.ts
    │
    └── servicios/               # Otros adaptadores de salida.
        ├── RelojDelSistema.ts
        ├── HasheadorBcrypt.ts
        ├── GeneradorTokenJwt.ts
        └── NotificadorConsola.ts

test/
└── dominio/                     # Pruebas unitarias del dominio.
    ├── Subasta.test.ts
    └── objetos-valor.test.ts

docs/
└── openapi.yaml                 # Especificación OpenAPI 3.0 de la API.
```

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

La especificación OpenAPI 3.0 está en [`docs/openapi.yaml`](docs/openapi.yaml).
Puede visualizarse pegándola en <https://editor.swagger.io> o sirviéndola con
cualquier visor de OpenAPI; describe cada recurso, sus parámetros, los cuerpos
de petición y todos los códigos de estado de respuesta.

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
| RN-13, RN-14, RN-15, RN-16 | `Subasta.cerrar()` (invocada desde `sincronizarCierre()`) |
| RN-21 | `Dinero.pesos()` |
| RN-22 | formato en `Email.crear()`, unicidad en `RegistrarUsuario` |
| RN-23 | `presentadores.ts` — no expone datos de contacto |

Los controladores HTTP (`src/infraestructura/http/controladores/`) no
contienen ningún `if` de negocio: leen la petición, llaman al caso de uso y
devuelven la respuesta.

## Endpoints disponibles en esta entrega

| Método | Ruta                     | Autenticado | Descripción                                    |
|--------|--------------------------|:-----------:|-------------------------------------------------|
| GET    | /salud                   | No          | Verificación de vida del servicio               |
| GET    | /categorias              | No          | Catálogo de categorías (datos semilla)          |
| POST   | /usuarios/registro       | No          | Registro de un usuario                           |
| POST   | /usuarios/login          | No          | Inicio de sesión, devuelve el token             |
| GET    | /usuarios/perfil         | Sí          | Perfil y subastas del usuario autenticado       |
| GET    | /usuarios/notificaciones | Sí          | Avisos dirigidos al usuario autenticado         |
| GET    | /subastas                | No          | Listado con filtros `categoriaId`, `estado`, `pagina`, `tamanoPagina` |
| GET    | /subastas/:id            | No          | Detalle e historial de pujas                     |
| POST   | /subastas                | Sí          | Publicar una subasta                             |
| DELETE | /subastas/:id            | Sí          | Cancelar una subasta sin pujas                   |
| POST   | /subastas/:id/pujas      | Sí          | Registrar una puja                               |

La autenticación usa un token portador JWT: `Authorization: Bearer <token>`,
obtenido en la respuesta de `/usuarios/login`.

## Notificación como concepto de dominio

`EventoDeDominio` describe un hecho ocurrido en la subasta como agregado
(útil para difundirlo tal cual por WebSockets a todos los suscritos).
`Notificacion` es distinta: es el aviso ya dirigido a un destinatario
concreto, con su propio mensaje. `Notificacion.desdeEvento()` decide, dentro
del dominio, cuántos avisos produce cada hecho y para quién — por ejemplo,
una subasta adjudicada genera dos notificaciones (ganador y vendedor),
mientras que una nueva puja vigente no genera ninguna porque es información
pública de la subasta y no un aviso personal. El adaptador `NotificadorConsola`
construye esas notificaciones a partir del evento y las persiste a través de
`NotificacionRepositorio`; se consultan en `GET /usuarios/notificaciones`.

## Qué queda para las siguientes entregas

- Adaptador de WebSockets que implemente `NotificadorDeEventos`.
- Endpoint de webhook para la pasarela de pagos, con verificación de origen
  y procesamiento idempotente.
- Aplicación web cliente.
- Persistencia real sustituyendo el adaptador en memoria.

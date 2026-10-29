# API de WebSockets

La API REST responde cuando el cliente pregunta. Por WebSocket es el
**servidor** el que informa al cliente sin que este pregunte: nuevas pujas,
avisos de puja superada, cierre de la subasta y su resultado.

## Conexión

```
ws://localhost:3000/ws?token=<JWT>
```

- El `token` es el mismo que devuelve `POST /usuarios/login`. Es **opcional**:
  sin token se puede seguir una subasta (su información es pública, RN-23), pero
  no se reciben avisos personales como «tu puja fue superada».
- Un token inválido no corta la conexión: se trata como anónima.
- El servidor envía un `ping` cada 30 s y descarta las conexiones que no
  responden, para que el conteo de participantes sea real.

## Mensajes del cliente al servidor

| Acción                 | Cuerpo                                                     | Efecto |
|------------------------|------------------------------------------------------------|--------|
| `SUSCRIBIR`            | `{"accion":"SUSCRIBIR","subastaId":"<id>"}`                | Empieza a recibir las novedades de la subasta. Responde con `SUSCRIPCION_CONFIRMADA` y el `ESTADO_SUBASTA` actual. |
| `CANCELAR_SUSCRIPCION` | `{"accion":"CANCELAR_SUSCRIPCION","subastaId":"<id>"}`     | Deja de recibir las novedades de esa subasta. |

Las pujas **no** viajan por WebSocket: se envían con `POST /subastas/{id}/pujas`,
porque necesitan una respuesta directa (aceptada, o rechazada con su motivo).

## Mensajes del servidor al cliente

Todos tienen la misma forma:

```json
{ "tipo": "NUEVA_PUJA_VIGENTE", "subastaId": "…", "datos": { … }, "fecha": "2026-10-28T21:55:47.852Z" }
```

| `tipo`                       | Destinatarios                     | `datos` |
|------------------------------|-----------------------------------|---------|
| `CONEXION_ESTABLECIDA`       | quien se conecta                  | `{ usuarioId \| null }` |
| `SUSCRIPCION_CONFIRMADA`     | quien se suscribe                 | — |
| `ESTADO_SUBASTA`             | quien se suscribe                 | La subasta completa, igual que `GET /subastas/{id}` |
| `NUEVA_PUJA_VIGENTE`         | todos los suscritos               | `{ postorId, ofertaVigente }` |
| `SUBASTA_CERRADA`            | todos los suscritos               | `{ estado: "ADJUDICADA", ganadorId, montoGanador }` o `{ estado: "DESIERTA" }` |
| `ESTADO_SUBASTA_ACTUALIZADO` | todos los suscritos               | `{ estado: "CANCELADA" \| "PAGADA" \| "INCUMPLIDA" }` |
| `PARTICIPANTES_CONECTADOS`   | todos los suscritos               | `{ cantidad }` (RF-16) |
| `AVISO`                      | solo el usuario destinatario      | Una notificación: `{ id, tipo, subastaId, mensaje, fecha }`. Por ejemplo `tipo: "PUJA_SUPERADA"` para quien acaba de ser superado, o `SUBASTA_ADJUDICADA_GANADOR` para el ganador |
| `ERROR`                      | quien envió el mensaje            | `{ codigo, mensaje }`, p. ej. `SUBASTA_NO_ENCONTRADA` |
| `SUSCRIPCION_CANCELADA`      | quien cancela                     | — |

Los avisos personales (`AVISO`) también quedan guardados y se pueden consultar
después con `GET /usuarios/notificaciones`.

## Recorrido de una puja

```
Navegador de Ana                API (Express)                  Dominio                 Navegadores suscritos
     │  POST /subastas/:id/pujas      │                            │                            │
     │──────────────────────────────▶│ PujasController            │                            │
     │                                │  └─ RegistrarPuja.ejecutar │                            │
     │                                │       ├─ repo.buscarPorId  │                            │
     │                                │       ├─ subasta.registrarPuja() ─▶ valida RN-06…RN-10  │
     │                                │       │                    │  y acumula eventos         │
     │                                │       ├─ repo.guardar      │                            │
     │                                │       └─ notificador.publicar(evento)  (puerto)         │
     │                                │             ├─ NotificadorConsola → log                 │
     │                                │             ├─ NotificadorAvisosPersonales → AVISO ────▶│ (solo al superado)
     │                                │             └─ DifusorWebSocket → NUEVA_PUJA_VIGENTE ──▶│ (todos)
     │◀────────────── 201 Created ────│                            │                            │
```

El caso de uso no conoce la librería `ws`: solo llama al puerto
`NotificadorDeEventos` (RNF-05). El adaptador `DifusorWebSocket` traduce cada
hecho del negocio a un mensaje (`src/infraestructura/tiempo-real/mensajes.ts`).

## Probarlo desde la consola

Con el servidor en marcha, en dos terminales distintas:

```bash
npm run ws -- <subastaId> <token-de-ana>
```

```bash
npm run ws -- <subastaId> <token-de-beto>
```

Cuando cualquiera de los dos puje por la API, ambas terminales mostrarán la
nueva oferta al instante; quien sea superado verá además su `AVISO`.

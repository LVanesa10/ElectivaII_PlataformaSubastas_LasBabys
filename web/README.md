# Aplicación web — LasBabys

Cliente web de la plataforma de subastas (Entrega 3). Consume la API REST y la
API de WebSockets del servidor que está en la raíz del repositorio.

## Por qué Next.js (RNF-11)

- Next.js organiza la aplicación por páginas (`src/app/<ruta>/page.tsx`), lo
  que deja una pantalla por cada requisito funcional.
- Su servidor de desarrollo reenvía `/api` a la API (`next.config.ts`), así el
  navegador usa un solo origen y la API no necesita CORS.
- React maneja bien el estado que cambia en tiempo real (la oferta vigente que
  llega por WebSocket) y Tailwind CSS permite dar estilo sin hojas aparte.

## Ejecutar en local

Requisito: la API en marcha (`npm start` en la raíz del repositorio, puerto 3000).

```bash
cd web
npm install
npm run dev
```

Abra <http://localhost:3001>.

Variables opcionales (ver `.env.example`; copie el archivo a `.env.local` para cambiarlas):

| Variable             | Por defecto               | Descripción |
|----------------------|---------------------------|-------------|
| `URL_API`            | `http://localhost:3000`   | API REST a la que se reenvía `/api` |
| `NEXT_PUBLIC_WS_URL` | `ws://<host>:3000/ws`     | WebSocket de la API |

## Pantallas y requisitos que cubren

| Ruta               | Qué hace | Requisitos |
|--------------------|----------|------------|
| `/`                | Listado de subastas abiertas con búsqueda y filtro por categoría | RF-22 |
| `/registro`        | Crear cuenta | RF-01 |
| `/login`           | Iniciar sesión; la sesión se conserva al recargar | RF-21 |
| `/subastas/nueva`  | Publicar una subasta | RF-23 |
| `/subastas/[id]`   | Detalle, historial, pujar, cuenta regresiva y actualización en tiempo real | RF-22, RF-23, RF-24, RF-25 |
| `/perfil`          | Subastas publicadas y con participación, avisos y órdenes de pago | RF-03, RF-17 |

## Estructura

```
web/src/
├── app/              # Una carpeta por ruta (App Router de Next.js).
├── components/       # Piezas compartidas: encabezado, mensaje de error de la API.
├── context/          # AuthContext: sesión del usuario disponible en toda la app.
└── lib/
    ├── api.ts              # Cliente de la API REST y tipos de sus respuestas.
    ├── sesion.ts           # Sesión guardada en el navegador (token y usuario).
    ├── useSubastaEnVivo.ts # Conexión WebSocket y suscripción a una subasta.
    └── formato.ts          # Formato de precios, fechas y estados.
```

## Cómo llega el tiempo real a la pantalla

1. Al abrir `/subastas/[id]`, la página pide el detalle por REST y abre un
   WebSocket con `useSubastaEnVivo`, que envía `{"accion":"SUSCRIBIR","subastaId":"…"}`.
2. Cuando alguien puja, el servidor envía `NUEVA_PUJA_VIGENTE` a todos los
   suscritos; la página vuelve a pedir el detalle y muestra la nueva oferta
   sin recargar.
3. Quien fue superado recibe además un `AVISO` personal, que aparece arriba
   del formulario de puja.
4. Al llegar la fecha de cierre, la cuenta regresiva vuelve a pedir el
   detalle; la API cierra la subasta en ese momento (cierre perezoso) y avisa
   `SUBASTA_CERRADA` a todos.
5. Si la conexión se cae, se reintenta sola y el servidor reenvía el estado
   actual de la subasta.

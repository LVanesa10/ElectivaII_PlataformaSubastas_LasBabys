# Aplicación web — Subastas en línea

Cliente web de la Entrega 3, hecho con React, Vite y TypeScript (modo estricto).
Consume la API REST y, más adelante, la API de WebSockets del servidor.

## Por qué React con Vite (RNF-11)

- React organiza la interfaz en componentes y maneja bien el estado que cambia
  en tiempo real (la oferta vigente que llega por WebSocket).
- Vite arranca en segundos y su servidor de desarrollo reenvía `/api` y `/ws`
  a la API, así el navegador usa un solo origen y la API no necesita CORS.

## Ejecutar en local

Requisito: la API en marcha (`npm start` en la raíz del repositorio, puerto 3000).

```bash
cd web
npm install
npm run dev
```

Abra <http://localhost:5173>. Si la API usa otro puerto, arranque con
`URL_API=http://localhost:<puerto> npm run dev`.

## Estructura

```
web/src/
├── api/          # Cliente HTTP: peticiones a la API y formato uniforme de errores.
├── sesion/       # Sesión del usuario: token guardado y validado al recargar (RF-21).
├── componentes/  # Piezas reutilizables: ruta protegida, mensaje de error (RF-25).
├── paginas/      # Pantallas: iniciar sesión, registro, inicio.
├── App.tsx       # Rutas de la aplicación.
└── main.tsx      # Punto de entrada.
```

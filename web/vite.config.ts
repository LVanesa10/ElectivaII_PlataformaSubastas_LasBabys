import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, Vite reenvía /api y /ws a la API (por defecto en el puerto
// 3000). Así el navegador habla con un solo origen y la API no necesita CORS.
const destinoApi = process.env.URL_API ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: destinoApi,
        changeOrigin: true,
        rewrite: (ruta) => ruta.replace(/^\/api/, ''),
      },
      '/ws': {
        target: destinoApi.replace(/^http/, 'ws'),
        ws: true,
      },
    },
  },
});

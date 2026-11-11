import type { NextConfig } from "next";

// La aplicación web corre en el puerto 3001 y reenvía /api a la API REST,
// que por defecto escucha en el 3000. Así el navegador habla con un solo
// origen y la API no necesita CORS.
const URL_API = process.env.URL_API ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${URL_API}/:path*`,
      },
    ];
  },

  cacheComponents: true,
  partialPrefetching: true,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Plataforma de Subastas en Línea API",
    version: "1.0.0",
    description: "Documentación de la API de subastas",
  },
  paths: {
    "/subastas": {
      post: {
        summary: "Publicar una nueva subasta",
        tags: ["Subastas"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  articulo: {
                    type: "object",
                    properties: {
                      denominacion: { type: "string" },
                      descripcion: { type: "string" },
                      estadoConservacion: { type: "string" }
                    }
                  },
                  categoriaId: { type: "string" },
                  precioBase: { type: "number" },
                  incrementoMinimo: { type: "number" },
                  fechaCierre: { type: "string", format: "date-time" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Subasta creada exitosamente" },
          "400": { description: "Datos inválidos o regla de negocio no cumplida" }
        }
      },
      get: {
        summary: "Listar subastas",
        tags: ["Subastas"],
        parameters: [
          { name: "categoriaId", in: "query", schema: { type: "string" } },
          { name: "estado", in: "query", schema: { type: "string" } },
          { name: "pagina", in: "query", schema: { type: "integer" } },
          { name: "limite", in: "query", schema: { type: "integer" } }
        ],
        responses: {
          "200": { description: "Lista de subastas" }
        }
      }
    },
    "/subastas/{id}": {
      get: {
        summary: "Obtener detalle de subasta",
        tags: ["Subastas"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Detalle de subasta" },
          "404": { description: "Subasta no encontrada" }
        }
      }
    },
    "/subastas/{id}/pujas": {
      post: {
        summary: "Registrar una puja",
        tags: ["Subastas"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  monto: { type: "number" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Puja registrada exitosamente" },
          "400": { description: "Puja rechazada" }
        }
      }
    }
  }
};

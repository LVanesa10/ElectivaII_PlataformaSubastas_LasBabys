
const API_URL = "/api";

export interface ApiError {
  error?: {
    codigo?: string;
    mensaje?: string;
    detalles?: unknown;
  };
}

export class ApiException extends Error {
  codigo?: string;
  detalles?: unknown;
  status: number;

  constructor(message: string, status: number, codigo?: string, detalles?: unknown) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data as ApiError | null;

    throw new ApiException(
      error?.error?.mensaje ?? "Ocurrió un error al comunicarse con el servidor.",
      response.status,
      error?.error?.codigo,
      error?.error?.detalles,
    );
  }

  return data as T;
}

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

export interface RespuestaLogin {
  token: string;
  usuarioId: string;
  nombre: string;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface Subasta {
  id: string;
  vendedorId: string;
  articulo: {
    denominacion: string;
    descripcion: string;
    estadoConservacion: string;
    categoriaId: string;
  };
  precioBase: number;
  incrementoMinimo: number;
  fechaPublicacion: string;
  fechaCierre: string;
  estado: "ABIERTA" | "CANCELADA" | "ADJUDICADA" | "DESIERTA" | "PAGADA" | "INCUMPLIDA";
  ofertaVigente: number | null;
  mejorPostorId: string | null;
  cantidadPujas: number;
}

export interface RespuestaSubastas {
  total: number;
  subastas: Subasta[];
}

export const authApi = {
  login: (correo: string, contrasena: string) =>
    apiRequest<RespuestaLogin>("/usuarios/login", {
      method: "POST",
      body: JSON.stringify({ correo, contrasena }),
    }),

  registro: (nombre: string, correo: string, contrasena: string) =>
    apiRequest<Usuario>("/usuarios/registro", {
      method: "POST",
      body: JSON.stringify({ nombre, correo, contrasena }),
    }),
};

export const subastasApi = {
  listar: (pagina = 1, tamanoPagina = 12) =>
    apiRequest<RespuestaSubastas>(
      `/subastas?pagina=${pagina}&tamanoPagina=${tamanoPagina}`,
    ),

  detalle: (id: string) =>
    apiRequest<Subasta & { historialPujas: unknown[] }>(
      `/subastas/${encodeURIComponent(id)}`,
    ),

  ofertar: (id: string, monto: number, token: string) =>
    apiRequest<unknown>(`/subastas/${encodeURIComponent(id)}/pujas`, {
      method: "POST",
      token,
      body: JSON.stringify({ monto }),
    }),
};

export const categoriasApi = {
  listar: () => apiRequest<Categoria[]>("/categorias"),
};

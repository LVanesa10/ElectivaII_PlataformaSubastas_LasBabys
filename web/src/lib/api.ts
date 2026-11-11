import { cerrarSesionGuardada } from "./sesion";

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

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...requestOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiException(
      "No fue posible conectar con el servidor. Verifica que la API esté en marcha.",
      0,
      "SIN_CONEXION",
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data as ApiError | null;

    // Un token vencido o inválido cierra la sesión guardada (RF-21).
    if (response.status === 401 && token) {
      cerrarSesionGuardada();
    }

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

export type EstadoSubasta =
  | "ABIERTA"
  | "CANCELADA"
  | "ADJUDICADA"
  | "DESIERTA"
  | "PAGADA"
  | "INCUMPLIDA";

export type EstadoConservacion =
  | "NUEVO"
  | "COMO_NUEVO"
  | "BUEN_ESTADO"
  | "ACEPTABLE"
  | "PARA_REPARAR";

export interface Puja {
  id: string;
  postorId: string;
  monto: number;
  fecha: string;
}

export interface OrdenPagoDeSubasta {
  id: string;
  ganadorId: string;
  monto: number;
  fechaGeneracion: string;
  fechaLimite: string;
  estado: "PENDIENTE" | "CONFIRMADA" | "VENCIDA";
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
  estado: EstadoSubasta;
  ofertaVigente: number | null;
  mejorPostorId: string | null;
  cantidadPujas: number;
  ordenPago: OrdenPagoDeSubasta | null;
}

export interface SubastaDetalle extends Subasta {
  historialPujas: Puja[];
}

export interface DatosPublicacion {
  denominacion: string;
  descripcion: string;
  estadoConservacion: EstadoConservacion;
  categoriaId: string;
  precioBase: number;
  incrementoMinimo: number;
  fechaCierre: string;
}

export interface Perfil {
  usuario: Usuario;
  subastasPublicadas: Subasta[];
  subastasConParticipacion: Subasta[];
}

export interface Notificacion {
  id: string;
  tipo: string;
  subastaId: string;
  mensaje: string;
  fecha: string;
}

export interface OrdenPago {
  id: string;
  subastaId: string;
  articulo: string;
  ganadorId: string;
  vendedorId: string;
  monto: number;
  fechaGeneracion: string;
  fechaLimite: string;
  estado: "PENDIENTE" | "CONFIRMADA" | "VENCIDA";
  estadoSubasta: EstadoSubasta;
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
    apiRequest<SubastaDetalle>(`/subastas/${encodeURIComponent(id)}`),

  ofertar: (id: string, monto: number, token: string) =>
    apiRequest<Puja>(`/subastas/${encodeURIComponent(id)}/pujas`, {
      method: "POST",
      token,
      body: JSON.stringify({ monto }),
    }),

  publicar: (datos: DatosPublicacion, token: string) =>
    apiRequest<Subasta>("/subastas", {
      method: "POST",
      token,
      body: JSON.stringify(datos),
    }),

  cancelar: (id: string, token: string) =>
    apiRequest<null>(`/subastas/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    }),
};

export const usuariosApi = {
  perfil: (token: string) => apiRequest<Perfil>("/usuarios/perfil", { token }),

  notificaciones: (token: string) =>
    apiRequest<Notificacion[]>("/usuarios/notificaciones", { token }),
};

export const ordenesPagoApi = {
  listarMias: (token: string) => apiRequest<OrdenPago[]>("/ordenes-pago", { token }),
};

export const categoriasApi = {
  listar: () => apiRequest<Categoria[]>("/categorias"),
};

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { authApi, usuariosApi, type RespuestaLogin } from "@/lib/api";
import {
  cerrarSesionGuardada,
  guardarSesion,
  leerSesion,
  suscribirseASesion,
  type Sesion,
} from "@/lib/sesion";

interface AuthContextType {
  usuario: { id: string; nombre: string } | null;
  token: string | null;
  cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// En el servidor no hay localStorage: la sesión se conoce al hidratar.
const SIN_LEER = undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  const sesion: Sesion | null | typeof SIN_LEER = useSyncExternalStore(
    suscribirseASesion,
    leerSesion,
    () => SIN_LEER,
  );

  // Un token guardado puede haber vencido: se comprueba una vez contra la
  // API. Si responde 401, el cliente de la API cierra la sesión.
  const tokenGuardado = sesion?.token;
  useEffect(() => {
    if (tokenGuardado) {
      usuariosApi.perfil(tokenGuardado).catch(() => undefined);
    }
  }, [tokenGuardado]);

  async function iniciarSesion(correo: string, contrasena: string) {
    const respuesta: RespuestaLogin = await authApi.login(correo, contrasena);

    guardarSesion({
      token: respuesta.token,
      usuario: { id: respuesta.usuarioId, nombre: respuesta.nombre },
    });
  }

  return (
    <AuthContext.Provider
      value={{
        usuario: sesion?.usuario ?? null,
        token: sesion?.token ?? null,
        cargando: sesion === SIN_LEER,
        iniciarSesion,
        cerrarSesion: cerrarSesionGuardada,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }

  return contexto;
}

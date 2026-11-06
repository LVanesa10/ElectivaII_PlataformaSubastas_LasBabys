
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi, type RespuestaLogin } from "@/lib/api";

interface AuthContextType {
  usuario: { id: string; nombre: string } | null;
  token: string | null;
  cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<AuthContextType["usuario"]>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const tokenGuardado = localStorage.getItem("lasbabys_token");
    const usuarioGuardado = localStorage.getItem("lasbabys_usuario");

    if (tokenGuardado && usuarioGuardado) {
      try {
        setToken(tokenGuardado);
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        localStorage.removeItem("lasbabys_token");
        localStorage.removeItem("lasbabys_usuario");
      }
    }

    setCargando(false);
  }, []);

  async function iniciarSesion(correo: string, contrasena: string) {
    const respuesta: RespuestaLogin = await authApi.login(correo, contrasena);

    const datosUsuario = {
      id: respuesta.usuarioId,
      nombre: respuesta.nombre,
    };

    localStorage.setItem("lasbabys_token", respuesta.token);
    localStorage.setItem("lasbabys_usuario", JSON.stringify(datosUsuario));

    setToken(respuesta.token);
    setUsuario(datosUsuario);
  }

  function cerrarSesion() {
    localStorage.removeItem("lasbabys_token");
    localStorage.removeItem("lasbabys_usuario");
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, token, cargando, iniciarSesion, cerrarSesion }}
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

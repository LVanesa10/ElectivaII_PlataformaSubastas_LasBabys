"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Encabezado() {
  const { usuario, cerrarSesion, cargando } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-[#29152F]"
        >
          Las<span className="text-[#D9468D]">Babys.</span>
        </Link>

        <nav className="flex items-center gap-3">
          {cargando ? (
            <span className="text-sm text-slate-400">Cargando...</span>
          ) : usuario ? (
            <>
              <span className="hidden text-sm font-semibold text-[#29152F] sm:inline">
                Hola, {usuario.nombre}
              </span>

              <Link
                href="/subastas/nueva"
                className="rounded-xl bg-[#D9468D] px-4 py-2 font-semibold text-white transition hover:bg-[#29152F]"
              >
                Publicar subasta
              </Link>

              <Link
                href="/perfil"
                className="rounded-xl px-4 py-2 font-semibold text-[#29152F] hover:bg-[#FFF0F5]"
              >
                Mi perfil
              </Link>

              <button
                onClick={cerrarSesion}
                className="rounded-xl border border-[#D9468D] px-4 py-2 font-semibold text-[#D9468D] transition hover:bg-[#FFF0F5]"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
              >
                Iniciar sesión
              </Link>

              <Link
                href="/registro"
                className="rounded-xl bg-[#D9468D] px-5 py-2.5 font-semibold text-white transition hover:bg-[#29152F]"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

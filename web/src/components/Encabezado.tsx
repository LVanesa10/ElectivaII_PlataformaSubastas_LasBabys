"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Encabezado() {
  const { usuario, cerrarSesion, cargando } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-[#29152F]/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-7">
        <Link href="/" className="shrink-0 text-2xl font-black tracking-tight text-[#29152F] sm:text-[27px]">
          Las<span className="text-[#D9468D]">Babys.</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#59445E] lg:flex">
          <Link href="/#subastas" className="transition hover:text-[#D9468D]">Explorar</Link>
          <Link href="/#categorias" className="transition hover:text-[#D9468D]">Categorías</Link>
          {usuario && <Link href="/perfil" className="transition hover:text-[#D9468D]">Mis subastas</Link>}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {cargando ? (
            <span className="text-xs text-slate-400">Cargando...</span>
          ) : usuario ? (
            <>
              <span className="hidden max-w-36 truncate text-sm font-semibold text-[#29152F] xl:block">Hola, {usuario.nombre}</span>
              <Link href="/subastas/nueva" className="rounded-xl bg-[#D9468D] px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#D9468D]/20 transition hover:-translate-y-0.5 hover:bg-[#c52f78] sm:px-5 sm:text-sm">Publicar subasta</Link>
              <Link href="/perfil" aria-label="Mi perfil" className="grid h-10 w-10 place-items-center rounded-full border border-[#D9468D]/20 bg-[#FFF0F5] text-sm font-black text-[#29152F]">{usuario.nombre?.charAt(0)?.toUpperCase() || "U"}</Link>
              <button onClick={cerrarSesion} className="hidden rounded-xl border border-[#D9468D]/40 px-3 py-2.5 text-xs font-bold text-[#D9468D] transition hover:bg-[#FFF0F5] sm:inline-flex">Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-3 py-2.5 text-sm font-bold text-[#29152F] transition hover:bg-[#FFF0F5]">Iniciar sesión</Link>
              <Link href="/registro" className="rounded-xl bg-[#D9468D] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#D9468D]/20 transition hover:bg-[#c52f78]">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

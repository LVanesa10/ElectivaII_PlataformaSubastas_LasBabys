
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, ApiException } from "@/lib/api";

export default function RegistroPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarRegistro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (contrasena !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      await authApi.registro(nombre, correo, contrasena);
      router.push("/login?registro=exitoso");
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "No fue posible crear la cuenta.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF0F5] px-5 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <section className="flex flex-col justify-center bg-[#29152F] p-10 text-white md:p-14">
          <Link href="/" className="text-3xl font-black">
            Las<span className="text-[#D9468D]">Babys.</span>
          </Link>

          <div className="my-12">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-[#FFB3C7]">
              Únete a nuestra comunidad
            </span>

            <h1 className="mt-8 text-4xl font-black leading-tight">
              Tu próxima gran oportunidad puede estar aquí.
            </h1>

            <p className="mt-5 leading-7 text-white/70">
              Crea tu cuenta, descubre artículos y participa en subastas
              desde un solo lugar.
            </p>
          </div>

          <p className="text-sm text-white/50">
            LasBabys · Plataforma de subastas
          </p>
        </section>

        <section className="flex flex-col justify-center p-8 md:p-14">
          <h2 className="text-3xl font-black text-[#29152F]">
            Crear una cuenta
          </h2>

          <p className="mt-3 text-slate-500">
            Regístrate para comenzar a participar.
          </p>

          <form onSubmit={manejarRegistro} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#29152F]">
                Nombre completo
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D9468D] focus:ring-2 focus:ring-[#D9468D]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#29152F]">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="nombre@correo.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D9468D] focus:ring-2 focus:ring-[#D9468D]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#29152F]">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D9468D] focus:ring-2 focus:ring-[#D9468D]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#29152F]">
                Confirmar contraseña
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D9468D] focus:ring-2 focus:ring-[#D9468D]/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-xl bg-[#D9468D] py-4 font-bold text-white transition hover:bg-[#c52f78] disabled:opacity-60"
            >
              {cargando ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-bold text-[#D9468D] hover:underline">
              Inicia sesión
            </Link>
          </p>

          <Link href="/" className="mt-4 text-center text-sm text-slate-400 hover:text-[#D9468D]">
            Volver al inicio
          </Link>
        </section>
      </div>
    </main>
  );
}

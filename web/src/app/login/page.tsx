
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiException } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { iniciarSesion } = useAuth();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function manejarLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      await iniciarSesion(correo, contrasena);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "No fue posible iniciar sesión. Intenta nuevamente.",
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
              Tu próxima oportunidad comienza aquí
            </span>

            <h1 className="mt-8 text-4xl font-black leading-tight">
              Las mejores oportunidades están a una oferta de distancia.
            </h1>

            <p className="mt-5 leading-7 text-white/70">
              Participa en subastas, realiza tus ofertas y encuentra aquello
              que estás buscando.
            </p>
          </div>

          <p className="text-sm text-white/50">
            LasBabys · Plataforma de subastas
          </p>
        </section>

        <section className="flex flex-col justify-center p-8 md:p-14">
          <h2 className="text-3xl font-black text-[#29152F]">
            ¡Qué bueno tenerte de vuelta!
          </h2>

          <p className="mt-3 text-slate-500">
            Ingresa tus datos para acceder a tu cuenta.
          </p>

          <form onSubmit={manejarLogin} className="mt-9 space-y-6">
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#D9468D] focus:ring-2 focus:ring-[#D9468D]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#29152F]">
                Contraseña
              </label>

              <input
                type="password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#D9468D] focus:ring-2 focus:ring-[#D9468D]/20"
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
              className="w-full rounded-xl bg-[#D9468D] py-4 font-bold text-white transition hover:bg-[#c52f78] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            ¿Todavía no tienes cuenta?{" "}
            <Link
              href="/registro"
              className="font-bold text-[#D9468D] hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>

          <Link
            href="/"
            className="mt-5 text-center text-sm text-slate-400 hover:text-[#D9468D]"
          >
            Volver al inicio
          </Link>
        </section>
      </div>
    </main>
  );
}

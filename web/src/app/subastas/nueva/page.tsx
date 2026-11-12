"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  categoriasApi,
  subastasApi,
  type Categoria,
  type EstadoConservacion,
} from "@/lib/api";
import { ESTADOS_CONSERVACION } from "@/lib/formato";
import { Encabezado } from "@/components/Encabezado";
import { MensajeError } from "@/components/MensajeError";

const ESTILO_CAMPO =
  "mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D9468D] focus:ring-2 focus:ring-[#D9468D]/20";

// RF-23: publicar una subasta. La página solo revisa el formato; las reglas
// de publicación (RN-01 a RN-03) las decide el dominio y llegan como error.
export default function PublicarSubastaPage() {
  const router = useRouter();
  const { token, cargando } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [denominacion, setDenominacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estadoConservacion, setEstadoConservacion] = useState<EstadoConservacion>("NUEVO");
  const [categoriaId, setCategoriaId] = useState("");
  const [precioBase, setPrecioBase] = useState("");
  const [incrementoMinimo, setIncrementoMinimo] = useState("");
  const [fechaCierre, setFechaCierre] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && !token) {
      router.replace("/login");
    }
  }, [cargando, token, router]);

  useEffect(() => {
    categoriasApi
      .listar()
      .then((lista) => {
        setCategorias(lista);
        setCategoriaId((actual) => actual || lista[0]?.id || "");
      })
      .catch(setError);
  }, []);

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!token) {
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const subasta = await subastasApi.publicar(
        {
          denominacion,
          descripcion,
          estadoConservacion,
          categoriaId,
          precioBase: Number(precioBase),
          incrementoMinimo: Number(incrementoMinimo),
          fechaCierre: new Date(fechaCierre).toISOString(),
        },
        token,
      );
      router.push(`/subastas/${encodeURIComponent(subasta.id)}`);
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Encabezado />
      <section className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-black text-[#29152F]">Publicar una subasta</h1>
        <p className="mt-2 text-slate-500">
          Una vez publicada no se puede modificar. Solo podrás cancelarla mientras no reciba
          pujas.
        </p>

        <form
          onSubmit={publicar}
          className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <label className="block text-sm font-semibold text-[#29152F]">
            Nombre del artículo
            <input
              required
              value={denominacion}
              onChange={(e) => setDenominacion(e.target.value)}
              placeholder="Ej.: Cámara analógica de 35 mm"
              className={ESTILO_CAMPO}
            />
          </label>

          <label className="block text-sm font-semibold text-[#29152F]">
            Descripción
            <textarea
              required
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={ESTILO_CAMPO}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#29152F]">
              Categoría
              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className={ESTILO_CAMPO}
              >
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[#29152F]">
              Estado de conservación
              <select
                value={estadoConservacion}
                onChange={(e) => setEstadoConservacion(e.target.value as EstadoConservacion)}
                className={ESTILO_CAMPO}
              >
                {ESTADOS_CONSERVACION.map((estado) => (
                  <option key={estado.valor} value={estado.valor}>
                    {estado.texto}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[#29152F]">
              Precio base (COP)
              <input
                type="number"
                required
                min={0}
                step={1}
                value={precioBase}
                onChange={(e) => setPrecioBase(e.target.value)}
                placeholder="200000"
                className={ESTILO_CAMPO}
              />
            </label>

            <label className="block text-sm font-semibold text-[#29152F]">
              Incremento mínimo (COP)
              <input
                type="number"
                required
                min={0}
                step={1}
                value={incrementoMinimo}
                onChange={(e) => setIncrementoMinimo(e.target.value)}
                placeholder="20000"
                className={ESTILO_CAMPO}
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-[#29152F]">
            Fecha y hora de cierre
            <input
              type="datetime-local"
              required
              value={fechaCierre}
              onChange={(e) => setFechaCierre(e.target.value)}
              className={ESTILO_CAMPO}
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              La subasta debe durar entre una hora y treinta días.
            </span>
          </label>

          <MensajeError error={error} />

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-[#D9468D] py-4 font-bold text-white transition hover:bg-[#c52f78] disabled:opacity-60"
          >
            {enviando ? "Publicando..." : "Publicar subasta"}
          </button>
        </form>
      </section>
    </main>
  );
}

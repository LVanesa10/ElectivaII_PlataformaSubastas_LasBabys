"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Encabezado } from "@/components/Encabezado";
import {
  ApiException,
  categoriasApi,
  subastasApi,
  type Categoria,
  type Subasta,
} from "@/lib/api";
import { formatoPrecio } from "@/lib/formato";

export default function Home() {
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargando(true);
        setError("");

        const [respuestaSubastas, respuestaCategorias] = await Promise.all([
          subastasApi.listar(1, 50),
          categoriasApi.listar(),
        ]);

        setSubastas(respuestaSubastas.subastas);
        setCategorias(respuestaCategorias);
      } catch (err) {
        setError(
          err instanceof ApiException
            ? err.message
            : "No fue posible conectar con el servidor.",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  const subastasFiltradas = useMemo(() => {
    return subastas.filter((subasta) => {
      const coincideBusqueda = subasta.articulo.denominacion
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      const coincideCategoria =
        !categoria || subasta.articulo.categoriaId === categoria;

      return (
        subasta.estado === "ABIERTA" &&
        coincideBusqueda &&
        coincideCategoria
      );
    });
  }, [subastas, busqueda, categoria]);

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Encabezado />

      <section className="bg-[#29152F] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <span className="mb-5 inline-block rounded-full bg-[#D9468D]/20 px-4 py-2 text-sm font-semibold text-[#FFB3C7]">
            Plataforma de subastas en línea
          </span>

          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Encuentra oportunidades.
            <span className="text-[#FF8A76]"> Haz tu mejor oferta.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Explora artículos, participa en subastas y compite en tiempo real
            por aquello que quieres conseguir.
          </p>

          <a
            href="#subastas"
            className="mt-9 inline-block rounded-xl bg-[#D9468D] px-7 py-4 font-bold text-white transition hover:bg-[#c52f78]"
          >
            Explorar subastas
          </a>
        </div>
      </section>

      <section id="subastas" className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <h2 className="text-3xl font-black">Subastas disponibles</h2>
          <p className="mt-2 text-slate-500">
            Descubre artículos y participa antes de que termine el tiempo.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_260px]">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar artículos..."
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 outline-none focus:border-[#D9468D]"
          />

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 outline-none focus:border-[#D9468D]"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {cargando && (
          <p className="py-12 text-center text-slate-500">
            Cargando subastas...
          </p>
        )}

        {!cargando && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-bold">No pudimos cargar las subastas</p>
            <p className="mt-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {!cargando && !error && subastasFiltradas.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h3 className="text-xl font-bold">No hay subastas disponibles</h3>
            <p className="mt-2 text-slate-500">
              Prueba con otra búsqueda o vuelve más tarde.
            </p>
          </div>
        )}

        {!cargando && !error && subastasFiltradas.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subastasFiltradas.map((subasta) => (
              <article
                key={subasta.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#FFF0F5] to-slate-100">
                  <span className="text-6xl">🏷️</span>
                </div>

                <div className="p-6">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    EN VIVO
                  </span>

                  <h3 className="mt-4 text-xl font-bold">
                    {subasta.articulo.denominacion}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {subasta.articulo.descripcion}
                  </p>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">Oferta actual</p>
                    <p className="mt-1 text-2xl font-black text-[#D9468D]">
                      {formatoPrecio(
                        subasta.ofertaVigente ?? subasta.precioBase,
                      )}
                    </p>

                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>{subasta.cantidadPujas} pujas</span>
                      <span>
                        Cierra:{" "}
                        {new Date(subasta.fechaCierre).toLocaleDateString(
                          "es-CO",
                        )}
                      </span>
                    </div>

                    <Link
                      href={`/subastas/${encodeURIComponent(subasta.id)}`}
                      className="mt-5 block rounded-xl bg-[#D9468D] py-3 text-center font-bold text-white transition hover:bg-[#29152F]"
                    >
                      Ver subasta
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
        LasBabys · Plataforma de Subastas · Electiva II · 2026
      </footer>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Encabezado } from "@/components/Encabezado";
import { ApiException, categoriasApi, subastasApi, type Categoria, type Subasta } from "@/lib/api";
import { formatoPrecio } from "@/lib/formato";

const ICONOS = ["💻", "⌚", "🎧", "📷", "🎮", "👜", "🎨", "📱"];

function iconoArticulo(nombre: string, indice: number) {
  const texto = nombre.toLowerCase();
  if (/portátil|laptop|computador|pc/.test(texto)) return "💻";
  if (/reloj/.test(texto)) return "⌚";
  if (/audífono|auricular/.test(texto)) return "🎧";
  if (/cámara|fotografía/.test(texto)) return "📷";
  if (/celular|iphone|teléfono/.test(texto)) return "📱";
  if (/videojuego|consola/.test(texto)) return "🎮";
  return ICONOS[indice % ICONOS.length];
}

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
        setCargando(true); setError("");
        const [respuestaSubastas, respuestaCategorias] = await Promise.all([subastasApi.listar(1, 50), categoriasApi.listar()]);
        setSubastas(respuestaSubastas.subastas); setCategorias(respuestaCategorias);
      } catch (err) {
        setError(err instanceof ApiException ? err.message : "No fue posible conectar con el servidor.");
      } finally { setCargando(false); }
    }
    cargarDatos();
  }, []);

  const subastasFiltradas = useMemo(() => subastas.filter((subasta) => {
    const coincideBusqueda = subasta.articulo.denominacion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = !categoria || subasta.articulo.categoriaId === categoria;
    return subasta.estado === "ABIERTA" && coincideBusqueda && coincideCategoria;
  }), [subastas, busqueda, categoria]);

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Encabezado />
      <section className="brand-surface relative isolate overflow-hidden px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="pointer-events-none absolute -right-24 top-8 -z-10 h-80 w-80 rounded-full border border-white/10 bg-[#D9468D]/10 blur-[1px] sm:right-[8%] sm:h-[430px] sm:w-[430px]" />
        <div className="pointer-events-none absolute right-[13%] top-24 hidden rotate-12 text-[150px] opacity-90 drop-shadow-2xl lg:block">🔨</div>
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FFB3C7]/20 bg-[#D9468D]/20 px-4 py-2 text-xs font-bold tracking-wide text-[#FFB3C7]"><span>✦</span> PLATAFORMA DE SUBASTAS EN LÍNEA</span>
            <h1 className="mt-7 text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-[66px]">Encuentra oportunidades.<br /><span className="text-[#FF8A76]">Haz tu mejor oferta.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">Descubre artículos únicos, participa en subastas y compite en tiempo real por aquello que quieres conseguir.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#subastas" className="rounded-xl bg-[#D9468D] px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:bg-[#c52f78]">Explorar subastas <span className="ml-2">→</span></a>
              <Link href="/registro" className="rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">Cómo funciona</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-7 text-sm text-white/70"><span><b className="text-xl text-white">En vivo</b><br/>Pujas en tiempo real</span><span><b className="text-xl text-white">A tu ritmo</b><br/>Explora desde cualquier lugar</span><span><b className="text-xl text-white">Seguro</b><br/>Gestiona tus órdenes</span></div>
          </div>
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="absolute inset-8 rounded-full bg-[#D9468D]/30 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between text-xs font-bold text-white/75"><span>OPORTUNIDADES DESTACADAS</span><span className="rounded-full bg-emerald-300/20 px-3 py-1 text-emerald-200">● EN VIVO</span></div>
              <div className="my-5 grid h-52 place-items-center rounded-2xl bg-gradient-to-br from-[#FFF0F5] via-[#f7d8e6] to-[#FFB3C7] text-8xl shadow-inner">🎧</div>
              <div className="flex items-start justify-between gap-3"><div><p className="text-lg font-extrabold">Tu próxima gran oportunidad</p><p className="mt-1 text-xs text-white/60">Participa y presenta tu mejor oferta</p></div><span className="rounded-xl bg-[#FF8A76] px-3 py-2 text-xs font-black text-[#29152F]">¡Puja!</span></div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#D9468D] to-[#FF8A76]" /></div>
              <p className="mt-2 text-right text-[11px] text-white/55">La emoción está en cada oferta</p>
            </div>
            <div className="absolute -bottom-6 -left-8 rounded-2xl border border-white/50 bg-white px-4 py-3 text-sm font-bold text-[#29152F] shadow-xl"><span className="mr-2 text-[#D9468D]">✦</span>¡Encuentra algo especial!</div>
          </div>
        </div>
      </section>

      <section id="categorias" className="mx-auto -mt-1 max-w-7xl px-5 pt-8 sm:px-8">
        <div className="grid gap-3 rounded-2xl border border-[#29152F]/5 bg-white p-5 shadow-[0_15px_45px_rgba(41,21,47,.06)] sm:grid-cols-3 sm:p-6">
          {[{icon:"📦",title:"Publica artículos",desc:"Pon tus productos en subasta de forma sencilla."},{icon:"🔨",title:"Participa y puja",desc:"Haz ofertas y compite con otros usuarios."},{icon:"🛡️",title:"Sigue tus compras",desc:"Consulta tus órdenes y el estado de tus subastas."}].map((item)=><div key={item.title} className="flex items-center gap-4 border-b border-slate-100 px-2 py-3 last:border-0 sm:border-b-0 sm:border-r sm:last:border-0"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFF0F5] text-2xl">{item.icon}</span><div><h3 className="font-extrabold text-[#29152F]">{item.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{item.desc}</p></div></div>)}
        </div>
      </section>

      <section id="subastas" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><span className="text-xs font-extrabold uppercase tracking-[.2em] text-[#D9468D]">Descubre y participa</span><h2 className="mt-2 text-3xl font-black tracking-tight text-[#29152F] sm:text-4xl">Subastas disponibles</h2><p className="mt-2 text-sm text-slate-500">Artículos que esperan por tu mejor oferta.</p></div><span className="rounded-full bg-[#FFF0F5] px-4 py-2 text-xs font-bold text-[#D9468D]">{subastasFiltradas.length} oportunidades</span></div>
        <div className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_260px]"><label className="flex items-center gap-3 rounded-xl bg-[#f7f8fc] px-4"><span className="text-xl text-[#D9468D]">⌕</span><input type="search" value={busqueda} onChange={(e)=>setBusqueda(e.target.value)} placeholder="Buscar artículos..." className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400" /></label><select value={categoria} onChange={(e)=>setCategoria(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-[#29152F] outline-none focus:border-[#D9468D]"><option value="">Todas las categorías</option>{categorias.map((item)=><option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
        {cargando && <div className="rounded-2xl bg-white py-16 text-center text-sm text-slate-500">Cargando subastas...</div>}
        {!cargando && error && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p className="font-bold">No pudimos cargar las subastas</p><p className="mt-2">{error}</p><button onClick={()=>window.location.reload()} className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">Intentar nuevamente</button></div>}
        {!cargando && !error && subastasFiltradas.length===0 && <div className="rounded-2xl border border-dashed border-[#D9468D]/30 bg-white px-6 py-16 text-center"><span className="text-5xl">🏷️</span><h3 className="mt-4 text-xl font-bold text-[#29152F]">No hay subastas disponibles</h3><p className="mt-2 text-sm text-slate-500">Prueba con otra búsqueda o vuelve más tarde.</p></div>}
        {!cargando && !error && subastasFiltradas.length>0 && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{subastasFiltradas.map((subasta,indice)=><article key={subasta.id} className="group overflow-hidden rounded-[1.4rem] border border-[#29152F]/8 bg-white shadow-[0_10px_35px_rgba(41,21,47,.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(41,21,47,.13)]"><div className="relative grid h-52 place-items-center overflow-hidden bg-gradient-to-br from-[#FFF0F5] via-[#f9e5ed] to-[#f1eaf4]"><div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/60"/><span className="relative text-7xl drop-shadow-sm transition duration-300 group-hover:scale-110">{iconoArticulo(subasta.articulo.denominacion,indice)}</span><span className="absolute left-4 top-4 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black tracking-wide text-emerald-700">● EN VIVO</span></div><div className="p-5"><h3 className="text-lg font-extrabold text-[#29152F]">{subasta.articulo.denominacion}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{subasta.articulo.descripcion}</p><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-slate-400">Oferta actual</p><p className="mt-1 text-2xl font-black text-[#D9468D]">{formatoPrecio(subasta.ofertaVigente??subasta.precioBase)}</p><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>🔨 {subasta.cantidadPujas} pujas</span><span>Cierra: {new Date(subasta.fechaCierre).toLocaleDateString("es-CO")}</span></div><Link href={`/subastas/${encodeURIComponent(subasta.id)}`} className="mt-5 block rounded-xl bg-[#D9468D] py-3 text-center text-sm font-extrabold text-white transition hover:bg-[#29152F]">Ver subasta <span className="ml-1">→</span></Link></div></div></article>)}</div>}
      </section>
      <footer className="border-t border-[#29152F]/10 bg-white px-5 py-9 text-center"><Link href="/" className="text-xl font-black text-[#29152F]">Las<span className="text-[#D9468D]">Babys.</span></Link><p className="mt-2 text-xs text-slate-400">Plataforma de Subastas · Electiva II · 2026</p></footer>
    </main>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { categoriasApi, subastasApi, type Categoria, type EstadoConservacion } from "@/lib/api";
import { ESTADOS_CONSERVACION } from "@/lib/formato";
import { Encabezado } from "@/components/Encabezado";
import { MensajeError } from "@/components/MensajeError";

const ESTILO_CAMPO = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-[#29152F] outline-none transition placeholder:text-slate-400 hover:border-[#D9468D]/40 focus:border-[#D9468D] focus:ring-4 focus:ring-[#D9468D]/10";

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

  useEffect(() => { if (!cargando && !token) router.replace("/login"); }, [cargando, token, router]);
  useEffect(() => { categoriasApi.listar().then((lista) => { setCategorias(lista); setCategoriaId((actual) => actual || lista[0]?.id || ""); }).catch(setError); }, []);

  async function publicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!token) return;
    setError(null); setEnviando(true);
    try {
      const subasta = await subastasApi.publicar({ denominacion, descripcion, estadoConservacion, categoriaId, precioBase: Number(precioBase), incrementoMinimo: Number(incrementoMinimo), fechaCierre: new Date(fechaCierre).toISOString() }, token);
      router.push(`/subastas/${encodeURIComponent(subasta.id)}`);
    } catch (err) { setError(err); setEnviando(false); }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Encabezado />
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8"><Link href="/" className="text-xs font-bold text-[#D9468D] hover:underline">← Volver al inicio</Link><p className="mt-5 text-xs font-extrabold uppercase tracking-[.2em] text-[#D9468D]">Comparte algo especial</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#29152F] sm:text-4xl">Publicar una subasta</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Prepara tu artículo, define las condiciones y deja que comiencen las ofertas.</p></div>
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={publicar} className="rounded-[1.6rem] border border-[#29152F]/8 bg-white p-5 shadow-[0_15px_45px_rgba(41,21,47,.06)] sm:p-8">
            <div className="mb-7 flex items-center gap-3 border-b border-slate-100 pb-5"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF0F5] text-xl">📦</span><div><h2 className="font-black text-[#29152F]">Información del artículo</h2><p className="mt-1 text-xs text-slate-400">Cuéntales a los compradores qué estás ofreciendo.</p></div></div>
            <div className="space-y-5">
              <label className="block text-sm font-bold text-[#29152F]">Nombre del artículo <span className="text-[#D9468D]">*</span><input required value={denominacion} onChange={(e)=>setDenominacion(e.target.value)} placeholder="Ej.: Cámara analógica de 35 mm" className={ESTILO_CAMPO}/></label>
              <label className="block text-sm font-bold text-[#29152F]">Descripción <span className="text-[#D9468D]">*</span><textarea required rows={5} value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} placeholder="Describe el artículo, sus características y detalles importantes..." className={`${ESTILO_CAMPO} resize-y`}/><span className="mt-1 block text-xs font-normal text-slate-400">Una descripción clara ayuda a generar confianza.</span></label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-bold text-[#29152F]">Categoría <span className="text-[#D9468D]">*</span><select required value={categoriaId} onChange={(e)=>setCategoriaId(e.target.value)} className={ESTILO_CAMPO}><option value="" disabled>Selecciona una categoría</option>{categorias.map((item)=><option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
                <label className="block text-sm font-bold text-[#29152F]">Estado de conservación<select value={estadoConservacion} onChange={(e)=>setEstadoConservacion(e.target.value as EstadoConservacion)} className={ESTILO_CAMPO}>{ESTADOS_CONSERVACION.map((estado)=><option key={estado.valor} value={estado.valor}>{estado.texto}</option>)}</select></label>
              </div>
            </div>
            <div className="mb-5 mt-9 flex items-center gap-3 border-b border-slate-100 pb-5"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF0F5] text-xl">💰</span><div><h2 className="font-black text-[#29152F]">Condiciones de la subasta</h2><p className="mt-1 text-xs text-slate-400">Establece el valor inicial y el incremento de las ofertas.</p></div></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-bold text-[#29152F]">Precio base (COP) <span className="text-[#D9468D]">*</span><input type="number" required min={0} step={1} value={precioBase} onChange={(e)=>setPrecioBase(e.target.value)} placeholder="200000" className={ESTILO_CAMPO}/></label>
              <label className="block text-sm font-bold text-[#29152F]">Incremento mínimo (COP) <span className="text-[#D9468D]">*</span><input type="number" required min={0} step={1} value={incrementoMinimo} onChange={(e)=>setIncrementoMinimo(e.target.value)} placeholder="20000" className={ESTILO_CAMPO}/></label>
              <label className="block text-sm font-bold text-[#29152F] sm:col-span-2">Fecha y hora de cierre <span className="text-[#D9468D]">*</span><input type="datetime-local" required value={fechaCierre} onChange={(e)=>setFechaCierre(e.target.value)} className={ESTILO_CAMPO}/><span className="mt-1 block text-xs font-normal text-slate-400">La subasta debe durar entre una hora y treinta días.</span></label>
            </div>
            <MensajeError error={error}/>
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-400">Los campos marcados con * son obligatorios.</p><button type="submit" disabled={enviando} className="rounded-xl bg-[#D9468D] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#D9468D]/20 transition hover:-translate-y-0.5 hover:bg-[#c52f78] disabled:cursor-not-allowed disabled:opacity-60">{enviando ? "Publicando..." : "🔨  Publicar subasta"}</button></div>
          </form>
          <aside className="space-y-5 lg:sticky lg:top-28">
            <div className="brand-surface overflow-hidden rounded-[1.6rem] p-6 text-white"><span className="text-4xl">🔨</span><h2 className="mt-4 text-xl font-black">Una buena subasta comienza con una buena publicación.</h2><p className="mt-2 text-sm leading-6 text-white/70">Presenta tu artículo con información completa y condiciones claras.</p></div>
            <div className="rounded-[1.6rem] border border-[#29152F]/8 bg-white p-6 shadow-[0_10px_35px_rgba(41,21,47,.05)]"><h3 className="font-black text-[#29152F]">Consejos para publicar</h3><ul className="mt-4 space-y-4 text-sm text-slate-600"><li className="flex gap-3"><span className="text-[#D9468D]">✓</span><span>Usa un título claro y fácil de identificar.</span></li><li className="flex gap-3"><span className="text-[#D9468D]">✓</span><span>Describe el estado real y las características del artículo.</span></li><li className="flex gap-3"><span className="text-[#D9468D]">✓</span><span>Define un precio base y un incremento razonables.</span></li><li className="flex gap-3"><span className="text-[#D9468D]">✓</span><span>Revisa la fecha de cierre antes de publicar.</span></li></ul></div>
            <div className="rounded-2xl border border-[#D9468D]/15 bg-[#FFF0F5] p-5"><p className="text-sm font-extrabold text-[#29152F]">Ten en cuenta</p><p className="mt-1 text-xs leading-5 text-[#76556b]">Una vez publicada, la subasta no se puede modificar. Solo podrás cancelarla mientras no reciba pujas.</p></div>
          </aside>
        </div>
      </section>
    </main>
  );
}

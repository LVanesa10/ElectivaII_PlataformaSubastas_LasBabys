"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ordenesPagoApi, usuariosApi, type Notificacion, type OrdenPago, type Perfil, type Subasta } from "@/lib/api";
import { ETIQUETAS_ESTADO, formatoFecha, formatoPrecio } from "@/lib/formato";
import { Encabezado } from "@/components/Encabezado";
import { MensajeError } from "@/components/MensajeError";

const ESTADO_ORDEN: Record<OrdenPago["estado"], string> = { PENDIENTE: "Pendiente de pago", CONFIRMADA: "Pagada", VENCIDA: "Vencida" };

export default function PerfilPage() {
  const router = useRouter();
  const { token, cargando } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenPago[]>([]);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (cargando) return;
    if (!token) { router.replace("/login"); return; }
    Promise.all([usuariosApi.perfil(token), usuariosApi.notificaciones(token), ordenesPagoApi.listarMias(token)])
      .then(([datosPerfil, datosNotificaciones, datosOrdenes]) => { setPerfil(datosPerfil); setNotificaciones(datosNotificaciones); setOrdenes(datosOrdenes); })
      .catch(setError);
  }, [cargando, token, router]);

  const totalGanadas = ordenes.length;
  const pendientes = ordenes.filter((orden) => orden.estado === "PENDIENTE").length;

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Encabezado />
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <MensajeError error={error} />
        {!perfil && !error && <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Cargando perfil...</div>}
        {perfil && <>
          <div className="mb-8 overflow-hidden rounded-[1.7rem] brand-surface p-6 text-white shadow-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/20 bg-white/15 text-2xl font-black text-white">{perfil.usuario.nombre?.charAt(0)?.toUpperCase() || "U"}</div><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#FFB3C7]">Tu espacio personal</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Hola, {perfil.usuario.nombre}</h1><p className="mt-1 text-sm text-white/65">{perfil.usuario.correo}</p></div></div>
              <Link href="/subastas/nueva" className="rounded-xl bg-[#D9468D] px-5 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#c52f78]">＋ Publicar subasta</Link>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Estadistica icono="🔨" etiqueta="Subastas publicadas" valor={perfil.subastasPublicadas.length} />
            <Estadistica icono="⚡" etiqueta="En las que participas" valor={perfil.subastasConParticipacion.length} />
            <Estadistica icono="🏆" etiqueta="Órdenes generadas" valor={totalGanadas} />
            <Estadistica icono="💳" etiqueta="Pagos pendientes" valor={pendientes} acento />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-6">
              <Bloque titulo="Subastas que publiqué" icono="📦" accion={<Link href="/subastas/nueva" className="text-xs font-extrabold text-[#D9468D] hover:underline">Publicar otra →</Link>}>
                <ListaSubastas subastas={perfil.subastasPublicadas} vacio="Aún no has publicado subastas." />
              </Bloque>
              <Bloque titulo="Subastas en las que participé" icono="⚡">
                <ListaSubastas subastas={perfil.subastasConParticipacion} vacio="Aún no has pujado en ninguna subasta." />
              </Bloque>
              <Bloque titulo="Mis órdenes de pago" icono="💳">
                {ordenes.length === 0 ? <Vacio texto="Aún no has ganado ninguna subasta." /> : <ul className="divide-y divide-slate-100">{ordenes.map((orden) => <li key={orden.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><Link href={`/subastas/${encodeURIComponent(orden.subastaId)}`} className="font-bold text-[#29152F] hover:text-[#D9468D]">{orden.articulo}</Link><p className="mt-1 text-sm text-slate-500">{formatoPrecio(orden.monto)} · pagar antes del {formatoFecha(orden.fechaLimite)}</p><p className="mt-1 text-xs text-slate-400">Orden {orden.id}</p></div><span className="rounded-full bg-[#FFF0F5] px-3 py-1.5 text-xs font-extrabold text-[#9d3267]">{ESTADO_ORDEN[orden.estado]}</span></li>)}</ul>}
              </Bloque>
            </div>
            <aside className="h-fit rounded-2xl border border-[#29152F]/8 bg-white p-6 shadow-[0_10px_35px_rgba(41,21,47,.05)]">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-black text-[#29152F]">Mis avisos</h2><p className="mt-1 text-xs text-slate-400">Actividad reciente de tus subastas</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF0F5] text-lg">🔔</span></div>
              {notificaciones.length === 0 ? <Vacio texto="No tienes avisos por ahora." /> : <ul className="space-y-3">{notificaciones.map((aviso) => <li key={aviso.id} className="rounded-xl bg-[#f7f8fc] p-4"><Link href={`/subastas/${encodeURIComponent(aviso.subastaId)}`} className="text-sm font-semibold leading-5 text-[#29152F] hover:text-[#D9468D]">{aviso.mensaje}</Link><p className="mt-2 text-[11px] text-slate-400">{formatoFecha(aviso.fecha)}</p></li>)}</ul>}
              <div className="mt-6 rounded-xl bg-gradient-to-br from-[#FFF0F5] to-white p-4"><p className="font-bold text-[#29152F]">¿Tienes algo para vender?</p><p className="mt-1 text-xs leading-5 text-slate-500">Publica tu artículo y permite que otros usuarios hagan sus ofertas.</p><Link href="/subastas/nueva" className="mt-3 inline-flex text-xs font-extrabold text-[#D9468D]">Crear una subasta →</Link></div>
            </aside>
          </div>
        </>}
      </section>
    </main>
  );
}

function Estadistica({ icono, etiqueta, valor, acento = false }: { icono: string; etiqueta: string; valor: number; acento?: boolean }) {
  return <div className="rounded-2xl border border-[#29152F]/8 bg-white p-5 shadow-[0_8px_25px_rgba(41,21,47,.04)]"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{etiqueta}</span><span className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${acento ? "bg-[#FFF0F5]" : "bg-[#f7f8fc]"}`}>{icono}</span></div><p className={`mt-3 text-3xl font-black ${acento ? "text-[#D9468D]" : "text-[#29152F]"}`}>{valor}</p></div>;
}
function Bloque({ titulo, icono, children, accion }: { titulo: string; icono: string; children: React.ReactNode; accion?: React.ReactNode }) {
  return <section className="rounded-2xl border border-[#29152F]/8 bg-white p-5 shadow-[0_10px_35px_rgba(41,21,47,.045)] sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF0F5]">{icono}</span><h2 className="text-lg font-black text-[#29152F]">{titulo}</h2></div>{accion}</div>{children}</section>;
}
function Vacio({ texto }: { texto: string }) { return <p className="rounded-xl bg-[#f7f8fc] px-4 py-5 text-sm text-slate-500">{texto}</p>; }
function ListaSubastas({ subastas, vacio }: { subastas: Subasta[]; vacio: string }) {
  if (!subastas.length) return <Vacio texto={vacio} />;
  return <ul className="divide-y divide-slate-100">{subastas.map((subasta) => { const etiqueta = ETIQUETAS_ESTADO[subasta.estado]; return <li key={subasta.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><Link href={`/subastas/${encodeURIComponent(subasta.id)}`} className="font-semibold text-[#29152F] hover:text-[#D9468D]">{subasta.articulo.denominacion}</Link><p className="mt-1 text-xs text-slate-400">{formatoPrecio(subasta.ofertaVigente ?? subasta.precioBase)} · {subasta.cantidadPujas} pujas</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold ${etiqueta.clases}`}>{etiqueta.texto}</span></li>; })}</ul>;
}

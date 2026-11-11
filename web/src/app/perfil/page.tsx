"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ordenesPagoApi,
  usuariosApi,
  type Notificacion,
  type OrdenPago,
  type Perfil,
  type Subasta,
} from "@/lib/api";
import { ETIQUETAS_ESTADO, formatoFecha, formatoPrecio } from "@/lib/formato";
import { Encabezado } from "@/components/Encabezado";
import { MensajeError } from "@/components/MensajeError";

const ESTADO_ORDEN: Record<OrdenPago["estado"], string> = {
  PENDIENTE: "Pendiente de pago",
  CONFIRMADA: "Pagada",
  VENCIDA: "Vencida",
};

// RF-03: perfil del usuario con las subastas que publicó y en las que
// participó, junto con sus avisos y sus órdenes de pago (RF-17).
export default function PerfilPage() {
  const router = useRouter();
  const { token, cargando } = useAuth();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenPago[]>([]);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (cargando) {
      return;
    }
    if (!token) {
      router.replace("/login");
      return;
    }
    Promise.all([
      usuariosApi.perfil(token),
      usuariosApi.notificaciones(token),
      ordenesPagoApi.listarMias(token),
    ])
      .then(([datosPerfil, datosNotificaciones, datosOrdenes]) => {
        setPerfil(datosPerfil);
        setNotificaciones(datosNotificaciones);
        setOrdenes(datosOrdenes);
      })
      .catch(setError);
  }, [cargando, token, router]);

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Encabezado />
      <section className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <MensajeError error={error} />

        {!perfil && !error && <p className="text-center text-slate-500">Cargando perfil...</p>}

        {perfil && (
          <>
            <div>
              <h1 className="text-3xl font-black text-[#29152F]">{perfil.usuario.nombre}</h1>
              <p className="mt-1 text-slate-500">{perfil.usuario.correo}</p>
            </div>

            <Bloque titulo="Mis órdenes de pago">
              {ordenes.length === 0 ? (
                <Vacio texto="Aún no has ganado ninguna subasta." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {ordenes.map((orden) => (
                    <li key={orden.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div>
                        <Link
                          href={`/subastas/${encodeURIComponent(orden.subastaId)}`}
                          className="font-bold text-[#29152F] hover:text-[#D9468D]"
                        >
                          {orden.articulo}
                        </Link>
                        <p className="text-sm text-slate-500">
                          {formatoPrecio(orden.monto)} · pagar antes del{" "}
                          {formatoFecha(orden.fechaLimite)}
                        </p>
                        <p className="text-xs text-slate-400">Orden {orden.id}</p>
                      </div>
                      <span className="rounded-full bg-[#FFF0F5] px-3 py-1 text-xs font-bold text-[#29152F]">
                        {ESTADO_ORDEN[orden.estado]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Bloque>

            <div className="grid gap-8 lg:grid-cols-2">
              <Bloque titulo="Subastas que publiqué">
                <ListaSubastas subastas={perfil.subastasPublicadas} vacio="Aún no has publicado subastas." />
              </Bloque>
              <Bloque titulo="Subastas en las que participé">
                <ListaSubastas
                  subastas={perfil.subastasConParticipacion}
                  vacio="Aún no has pujado en ninguna subasta."
                />
              </Bloque>
            </div>

            <Bloque titulo="Mis avisos">
              {notificaciones.length === 0 ? (
                <Vacio texto="No tienes avisos." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notificaciones.map((aviso) => (
                    <li key={aviso.id} className="py-3">
                      <Link
                        href={`/subastas/${encodeURIComponent(aviso.subastaId)}`}
                        className="font-semibold text-[#29152F] hover:text-[#D9468D]"
                      >
                        {aviso.mensaje}
                      </Link>
                      <p className="text-xs text-slate-400">{formatoFecha(aviso.fecha)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Bloque>
          </>
        )}
      </section>
    </main>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-xl font-black text-[#29152F]">{titulo}</h2>
      {children}
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p className="text-slate-500">{texto}</p>;
}

function ListaSubastas({ subastas, vacio }: { subastas: Subasta[]; vacio: string }) {
  if (subastas.length === 0) {
    return <Vacio texto={vacio} />;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {subastas.map((subasta) => {
        const etiqueta = ETIQUETAS_ESTADO[subasta.estado];
        return (
          <li key={subasta.id} className="flex items-center justify-between gap-2 py-3">
            <Link
              href={`/subastas/${encodeURIComponent(subasta.id)}`}
              className="font-semibold text-[#29152F] hover:text-[#D9468D]"
            >
              {subasta.articulo.denominacion}
            </Link>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${etiqueta.clases}`}>
              {etiqueta.texto}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

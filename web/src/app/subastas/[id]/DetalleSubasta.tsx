"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subastasApi, type SubastaDetalle } from "@/lib/api";
import { ETIQUETAS_ESTADO, formatoFecha, formatoPrecio } from "@/lib/formato";
import { useSubastaEnVivo, type MensajeTiempoReal } from "@/lib/useSubastaEnVivo";
import { MensajeError } from "@/components/MensajeError";

function tiempoRestante(fechaCierre: string, ahora: number): string {
  const ms = new Date(fechaCierre).getTime() - ahora;
  if (ms <= 0) {
    return "Cerrando...";
  }
  const totalSegundos = Math.floor(ms / 1000);
  const dias = Math.floor(totalSegundos / 86_400);
  const horas = Math.floor((totalSegundos % 86_400) / 3_600);
  const minutos = Math.floor((totalSegundos % 3_600) / 60);
  const segundos = totalSegundos % 60;
  return dias > 0
    ? `${dias} d ${horas} h ${minutos} min`
    : `${horas} h ${minutos} min ${segundos} s`;
}

export function DetalleSubasta() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { usuario, token } = useAuth();

  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [errorCarga, setErrorCarga] = useState<unknown>(null);
  const [monto, setMonto] = useState("");
  const [errorPuja, setErrorPuja] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const [novedad, setNovedad] = useState("");
  const [avisos, setAvisos] = useState<string[]>([]);
  const [ahora, setAhora] = useState(() => Date.now());

  // Consultar la subasta también hace que la API aplique el cierre si la
  // fecha ya pasó; el cierre se anuncia luego por WebSocket.
  const recargar = useCallback(async () => {
    try {
      setSubasta(await subastasApi.detalle(id));
      setErrorCarga(null);
    } catch (error) {
      setErrorCarga(error);
    }
  }, [id]);

  useEffect(() => {
    let vigente = true;
    subastasApi
      .detalle(id)
      .then((detalle) => vigente && setSubasta(detalle))
      .catch((error) => vigente && setErrorCarga(error));
    return () => {
      vigente = false;
    };
  }, [id]);

  const { conexion, participantes } = useSubastaEnVivo(
    id,
    token,
    (mensaje: MensajeTiempoReal) => {
      switch (mensaje.tipo) {
        case "ESTADO_SUBASTA":
          setSubasta(mensaje.datos as unknown as SubastaDetalle);
          break;
        case "NUEVA_PUJA_VIGENTE":
          setNovedad(`Nueva oferta: ${formatoPrecio(Number(mensaje.datos?.ofertaVigente))}`);
          recargar();
          break;
        case "SUBASTA_CERRADA":
          setNovedad(
            mensaje.datos?.estado === "ADJUDICADA"
              ? "La subasta cerró y fue adjudicada."
              : "La subasta cerró sin pujas y quedó desierta.",
          );
          recargar();
          break;
        case "ESTADO_SUBASTA_ACTUALIZADO":
          setNovedad(`La subasta cambió a ${String(mensaje.datos?.estado).toLowerCase()}.`);
          recargar();
          break;
        case "AVISO":
          setAvisos((anteriores) => [String(mensaje.datos?.mensaje), ...anteriores]);
          break;
      }
    },
  );

  // Reloj de la cuenta regresiva.
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1_000);
    return () => clearInterval(intervalo);
  }, []);

  // Al cumplirse la fecha de cierre se consulta la subasta: la API la cierra
  // en ese momento (cierre perezoso) y avisa a todos los suscritos.
  const cierreCumplido =
    subasta?.estado === "ABIERTA" && new Date(subasta.fechaCierre).getTime() <= ahora;
  useEffect(() => {
    if (cierreCumplido) {
      const espera = setTimeout(recargar, 1_000);
      return () => clearTimeout(espera);
    }
  }, [cierreCumplido, recargar]);

  if (errorCarga && !subasta) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-14">
        <MensajeError error={errorCarga} />
        <Link href="/" className="mt-6 inline-block font-bold text-[#D9468D] hover:underline">
          Volver al listado
        </Link>
      </section>
    );
  }

  if (!subasta) {
    return <p className="py-16 text-center text-slate-500">Cargando subasta...</p>;
  }

  const minimoSiguiente =
    subasta.ofertaVigente === null
      ? subasta.precioBase
      : subasta.ofertaVigente + subasta.incrementoMinimo;
  const esVendedor = usuario?.id === subasta.vendedorId;
  const voyGanando = usuario !== null && usuario.id === subasta.mejorPostorId;
  const etiqueta = ETIQUETAS_ESTADO[subasta.estado];

  async function pujar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!token) {
      return;
    }
    setErrorPuja(null);
    setEnviando(true);
    try {
      // El monto viaja tal cual: el dominio decide si la puja procede.
      await subastasApi.ofertar(id, Number(monto), token);
      setMonto("");
      await recargar();
    } catch (error) {
      setErrorPuja(error);
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    if (!token || !window.confirm("¿Cancelar esta subasta? No se puede deshacer.")) {
      return;
    }
    try {
      await subastasApi.cancelar(id, token);
      await recargar();
    } catch (error) {
      setErrorPuja(error);
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold text-slate-500 hover:text-[#D9468D]"
        >
          ← Volver
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${etiqueta.clases}`}>
              {etiqueta.texto}
            </span>
            <IndicadorConexion conexion={conexion} participantes={participantes} />
          </div>

          <h1 className="mt-4 text-3xl font-black text-[#29152F]">
            {subasta.articulo.denominacion}
          </h1>
          <p className="mt-3 text-slate-600">{subasta.articulo.descripcion}</p>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <Dato titulo="Precio base" valor={formatoPrecio(subasta.precioBase)} />
            <Dato titulo="Incremento mínimo" valor={formatoPrecio(subasta.incrementoMinimo)} />
            <Dato titulo="Cierra" valor={formatoFecha(subasta.fechaCierre)} />
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-black text-[#29152F]">
            Historial de pujas ({subasta.historialPujas.length})
          </h2>
          {subasta.historialPujas.length === 0 ? (
            <p className="mt-4 text-slate-500">Todavía no hay pujas. ¡Sé el primero!</p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Postor</th>
                  <th className="py-2">Monto</th>
                  <th className="py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {[...subasta.historialPujas].reverse().map((puja) => (
                  <tr key={puja.id} className="border-t border-slate-100">
                    <td className="py-2">
                      {puja.postorId === usuario?.id ? "Tú" : `Postor ${puja.postorId.slice(0, 8)}`}
                    </td>
                    <td className="py-2 font-semibold">{formatoPrecio(puja.monto)}</td>
                    <td className="py-2 text-slate-500">{formatoFecha(puja.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        {avisos.map((aviso, indice) => (
          <div
            key={indice}
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800"
          >
            {aviso}
          </div>
        ))}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            {subasta.ofertaVigente === null
              ? "Precio base"
              : subasta.ordenPago
                ? "Oferta ganadora"
                : "Oferta vigente"}
          </p>
          <p className="mt-1 text-4xl font-black text-[#D9468D]">
            {formatoPrecio(subasta.ofertaVigente ?? subasta.precioBase)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{subasta.cantidadPujas} pujas</p>
          {novedad && (
            <p role="status" className="mt-3 rounded-lg bg-[#FFF0F5] px-3 py-2 text-sm font-semibold text-[#29152F]">
              {novedad}
            </p>
          )}

          {subasta.estado === "ABIERTA" && (
            <p className="mt-4 text-sm text-slate-600">
              Termina en{" "}
              <strong className="text-[#29152F]">
                {tiempoRestante(subasta.fechaCierre, ahora)}
              </strong>
            </p>
          )}

          {subasta.estado === "ABIERTA" && !usuario && (
            <Link
              href="/login"
              className="mt-6 block rounded-xl bg-[#D9468D] py-3 text-center font-bold text-white hover:bg-[#29152F]"
            >
              Inicia sesión para pujar
            </Link>
          )}

          {subasta.estado === "ABIERTA" && usuario && !esVendedor && (
            <form onSubmit={pujar} className="mt-6 space-y-3">
              <label className="block text-sm font-semibold text-[#29152F]">
                Tu oferta (mínimo {formatoPrecio(minimoSiguiente)})
                <input
                  type="number"
                  required
                  min={0}
                  step={1}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder={String(minimoSiguiente)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#D9468D] focus:ring-2 focus:ring-[#D9468D]/20"
                />
              </label>
              {voyGanando && (
                <p className="text-sm font-semibold text-green-700">Vas ganando esta subasta.</p>
              )}
              <MensajeError error={errorPuja} />
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-xl bg-[#D9468D] py-3 font-bold text-white transition hover:bg-[#c52f78] disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Pujar"}
              </button>
            </form>
          )}

          {subasta.estado === "ABIERTA" && esVendedor && (
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <p>Publicaste esta subasta, así que no puedes pujar en ella.</p>
              {subasta.cantidadPujas === 0 && (
                <button
                  onClick={cancelar}
                  className="w-full rounded-xl border border-red-300 py-3 font-bold text-red-600 hover:bg-red-50"
                >
                  Cancelar subasta
                </button>
              )}
              <MensajeError error={errorPuja} />
            </div>
          )}

          {subasta.estado !== "ABIERTA" && <ResultadoCierre subasta={subasta} usuarioId={usuario?.id} />}
        </div>
      </aside>
    </section>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-[#f7f8fc] p-4">
      <dt className="text-slate-500">{titulo}</dt>
      <dd className="mt-1 font-bold text-[#29152F]">{valor}</dd>
    </div>
  );
}

function IndicadorConexion({
  conexion,
  participantes,
}: {
  conexion: string;
  participantes: number | null;
}) {
  const conectado = conexion === "conectado";
  return (
    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
      <span className={`h-2 w-2 rounded-full ${conectado ? "bg-green-500" : "bg-amber-400"}`} />
      {conectado ? "Actualizando en tiempo real" : "Reconectando..."}
      {conectado &&
        participantes !== null &&
        ` · ${participantes} ${participantes === 1 ? "conectado" : "conectados"}`}
    </span>
  );
}

function ResultadoCierre({
  subasta,
  usuarioId,
}: {
  subasta: SubastaDetalle;
  usuarioId?: string;
}) {
  const orden = subasta.ordenPago;
  const gane = orden !== null && orden.ganadorId === usuarioId;

  return (
    <div className="mt-6 space-y-3 text-sm text-slate-600">
      {subasta.estado === "DESIERTA" && <p>La subasta cerró sin pujas.</p>}
      {subasta.estado === "CANCELADA" && <p>El vendedor canceló esta subasta.</p>}
      {orden && (
        <>
          <p>
            {gane ? "¡Ganaste esta subasta!" : "Subasta adjudicada al mejor postor."} Orden de
            pago por <strong>{formatoPrecio(orden.monto)}</strong>, estado{" "}
            <strong>{orden.estado.toLowerCase()}</strong>.
          </p>
          {gane && orden.estado === "PENDIENTE" && (
            <p>Tienes hasta el {formatoFecha(orden.fechaLimite)} para pagarla.</p>
          )}
          {gane && (
            <Link href="/perfil" className="font-bold text-[#D9468D] hover:underline">
              Ver mis órdenes de pago
            </Link>
          )}
        </>
      )}
    </div>
  );
}

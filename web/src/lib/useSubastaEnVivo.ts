"use client";

import { useEffect, useEffectEvent, useState } from "react";

// Contrato de los mensajes que envía el servidor (docs/websockets.md).
export interface MensajeTiempoReal {
  tipo:
    | "CONEXION_ESTABLECIDA"
    | "SUSCRIPCION_CONFIRMADA"
    | "SUSCRIPCION_CANCELADA"
    | "ESTADO_SUBASTA"
    | "NUEVA_PUJA_VIGENTE"
    | "SUBASTA_CERRADA"
    | "ESTADO_SUBASTA_ACTUALIZADO"
    | "PARTICIPANTES_CONECTADOS"
    | "AVISO"
    | "ERROR";
  subastaId?: string;
  datos?: Record<string, unknown>;
  fecha: string;
}

export type EstadoConexion = "conectando" | "conectado" | "desconectado";

const REINTENTO_MAXIMO_MS = 10_000;

// El WebSocket va directo a la API: un navegador puede abrirlo hacia otro
// puerto sin configurar CORS.
function urlWebSocket(token: string | null): string {
  const base =
    process.env.NEXT_PUBLIC_WS_URL ?? `ws://${window.location.hostname}:3000/ws`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

// Suscribe la página a las novedades de una subasta (RF-12, RF-24): el
// servidor avisa sin que el navegador pregunte. Si la conexión se cae, se
// reintenta con espera creciente y, al volver, el servidor reenvía el estado
// actual de la subasta.
export function useSubastaEnVivo(
  subastaId: string,
  token: string | null,
  alRecibir: (mensaje: MensajeTiempoReal) => void,
) {
  const [conexion, setConexion] = useState<EstadoConexion>("conectando");
  const [participantes, setParticipantes] = useState<number | null>(null);

  const procesar = useEffectEvent((mensaje: MensajeTiempoReal) => {
    if (mensaje.tipo === "PARTICIPANTES_CONECTADOS") {
      setParticipantes(Number(mensaje.datos?.cantidad ?? 0));
    }
    alRecibir(mensaje);
  });

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reintento: ReturnType<typeof setTimeout> | undefined;
    let espera = 1_000;
    let activo = true;

    function conectar() {
      socket = new WebSocket(urlWebSocket(token));

      socket.onopen = () => {
        espera = 1_000;
        setConexion("conectado");
        socket?.send(JSON.stringify({ accion: "SUSCRIBIR", subastaId }));
      };

      socket.onmessage = (evento) => {
        try {
          procesar(JSON.parse(String(evento.data)) as MensajeTiempoReal);
        } catch {
          // Un mensaje que no es JSON no cumple el contrato: se ignora.
        }
      };

      socket.onclose = () => {
        if (!activo) {
          return;
        }
        setConexion("desconectado");
        reintento = setTimeout(() => {
          setConexion("conectando");
          conectar();
        }, espera);
        espera = Math.min(espera * 2, REINTENTO_MAXIMO_MS);
      };
    }

    conectar();

    return () => {
      activo = false;
      clearTimeout(reintento);
      socket?.close();
    };
  }, [subastaId, token]);

  return { conexion, participantes };
}

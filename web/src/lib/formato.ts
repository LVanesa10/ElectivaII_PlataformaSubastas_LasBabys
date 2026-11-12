import type { EstadoSubasta } from "./api";

export const formatoPrecio = (precio: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(precio);

export const formatoFecha = (fecha: string) =>
  new Date(fecha).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const ETIQUETAS_ESTADO: Record<EstadoSubasta, { texto: string; clases: string }> = {
  ABIERTA: { texto: "En vivo", clases: "bg-green-100 text-green-700" },
  ADJUDICADA: { texto: "Adjudicada", clases: "bg-blue-100 text-blue-700" },
  PAGADA: { texto: "Pagada", clases: "bg-emerald-100 text-emerald-700" },
  DESIERTA: { texto: "Desierta", clases: "bg-slate-200 text-slate-600" },
  CANCELADA: { texto: "Cancelada", clases: "bg-slate-200 text-slate-600" },
  INCUMPLIDA: { texto: "Incumplida", clases: "bg-red-100 text-red-700" },
};

export const ESTADOS_CONSERVACION = [
  { valor: "NUEVO", texto: "Nuevo" },
  { valor: "COMO_NUEVO", texto: "Como nuevo" },
  { valor: "BUEN_ESTADO", texto: "Buen estado" },
  { valor: "ACEPTABLE", texto: "Aceptable" },
  { valor: "PARA_REPARAR", texto: "Para reparar" },
] as const;

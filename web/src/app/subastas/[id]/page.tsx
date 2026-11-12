import { Suspense } from "react";
import { Encabezado } from "@/components/Encabezado";
import { DetalleSubasta } from "./DetalleSubasta";

// El id llega en la URL y solo se conoce al pedir la página; por eso el
// detalle se carga dentro de un Suspense.
export default function PaginaSubasta() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Encabezado />
      <Suspense
        fallback={<p className="py-16 text-center text-slate-500">Cargando subasta...</p>}
      >
        <DetalleSubasta />
      </Suspense>
    </main>
  );
}

import { ApiException } from "@/lib/api";

// Muestra de forma comprensible un error devuelto por la API (RF-25): el
// mensaje, los campos con formato inválido y el código de la regla, que
// ayuda a saber qué condición del negocio no se cumplió.
export function MensajeError({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }

  const mensaje =
    error instanceof Error ? error.message : "Ocurrió un error inesperado.";
  const codigo = error instanceof ApiException ? error.codigo : undefined;
  const detalles =
    error instanceof ApiException && error.detalles && typeof error.detalles === "object"
      ? (error.detalles as Record<string, string>)
      : undefined;

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      <p className="font-semibold">{mensaje}</p>
      {detalles && (
        <ul className="mt-2 list-disc pl-5">
          {Object.entries(detalles).map(([campo, problema]) => (
            <li key={campo}>
              <strong>{campo}:</strong> {problema}
            </li>
          ))}
        </ul>
      )}
      {codigo && <p className="mt-2 text-xs text-red-500">Código: {codigo}</p>}
    </div>
  );
}

// Sesión guardada en el navegador (RF-21). Es un almacén pequeño, fuera de
// React, para que tanto el contexto de autenticación como el cliente de la
// API puedan leerla y cerrarla (por ejemplo, cuando el token vence).

export interface Sesion {
  token: string;
  usuario: { id: string; nombre: string };
}

const CLAVE_TOKEN = "lasbabys_token";
const CLAVE_USUARIO = "lasbabys_usuario";

const suscriptores = new Set<() => void>();
let ultimaLectura: { token: string | null; usuario: string | null } | null = null;
let ultimaSesion: Sesion | null = null;

function avisarCambio() {
  suscriptores.forEach((suscriptor) => suscriptor());
}

export function suscribirseASesion(alCambiar: () => void): () => void {
  suscriptores.add(alCambiar);
  // Otra pestaña que inicia o cierra sesión también actualiza esta.
  window.addEventListener("storage", alCambiar);
  return () => {
    suscriptores.delete(alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

// Devuelve siempre el mismo objeto mientras lo guardado no cambie, como
// exige useSyncExternalStore.
export function leerSesion(): Sesion | null {
  let token: string | null = null;
  let usuario: string | null = null;
  try {
    token = localStorage.getItem(CLAVE_TOKEN);
    usuario = localStorage.getItem(CLAVE_USUARIO);
  } catch {
    return null;
  }

  if (ultimaLectura?.token === token && ultimaLectura?.usuario === usuario) {
    return ultimaSesion;
  }

  ultimaLectura = { token, usuario };
  try {
    ultimaSesion = token && usuario ? { token, usuario: JSON.parse(usuario) } : null;
  } catch {
    ultimaSesion = null;
  }
  return ultimaSesion;
}

export function guardarSesion(sesion: Sesion) {
  localStorage.setItem(CLAVE_TOKEN, sesion.token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion.usuario));
  avisarCambio();
}

export function cerrarSesionGuardada() {
  try {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
  avisarCambio();
}

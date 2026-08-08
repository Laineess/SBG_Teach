import type { Perfil, RespuestaRuta } from "./types";

/**
 * En desarrollo, `/api` lo proxea Vite hacia el servidor Express local.
 * En producción se define VITE_API_URL con la URL de Amazon API Gateway.
 */
const BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "/api";

export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly detalles?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ErrorApi";
  }
}

export async function solicitarRuta(perfil: Perfil, signal?: AbortSignal): Promise<RespuestaRuta> {
  let respuesta: Response;

  try {
    respuesta = await fetch(`${BASE}/ruta`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(perfil),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ErrorApi("No se pudo contactar al servicio. ¿Está corriendo la API?");
  }

  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensaje =
      (cuerpo as { error?: string } | null)?.error ?? `El servicio respondió ${respuesta.status}.`;
    throw new ErrorApi(mensaje, (cuerpo as { detalles?: Record<string, string[]> } | null)?.detalles);
  }

  return cuerpo as RespuestaRuta;
}

import { AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk";
import { construirMensajeUsuario, SYSTEM_PROMPT } from "./prompt.js";
import { rutaDeEjemplo } from "./mock.js";
import { rutaJsonSchema, rutaSchema, type Perfil, type Ruta } from "./schema.js";

const REGION = process.env.AWS_REGION ?? "us-east-1";
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-opus-5";
const EFFORT = (process.env.BEDROCK_EFFORT ?? "medium") as "low" | "medium" | "high" | "xhigh" | "max";
const MOCK = process.env.MOCK === "1" || process.env.MOCK === "true";

/** El cliente se crea una sola vez y se reutiliza entre invocaciones tibias de Lambda. */
let cliente: AnthropicBedrockMantle | null = null;
function obtenerCliente(): AnthropicBedrockMantle {
  cliente ??= new AnthropicBedrockMantle({ awsRegion: REGION });
  return cliente;
}

export class ErrorBedrock extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly causa?: unknown,
  ) {
    super(message);
    this.name = "ErrorBedrock";
  }
}

export interface ResultadoRuta {
  ruta: Ruta;
  meta: {
    modelo: string;
    origen: "bedrock" | "mock";
    tokens_entrada?: number;
    tokens_salida?: number;
    ms: number;
  };
}

/**
 * Núcleo del proyecto: perfil del estudiante -> ruta de estudio validada.
 *
 * Se pide salida estructurada (`output_config.format`) para que el JSON venga
 * garantizado por el API. Si la región o el modelo no soportan structured
 * outputs, se reintenta sin ese parámetro y se extrae el JSON del texto.
 */
export async function generarRuta(perfil: Perfil): Promise<ResultadoRuta> {
  const inicio = Date.now();

  if (MOCK) {
    return {
      ruta: rutaDeEjemplo(perfil),
      meta: { modelo: "mock", origen: "mock", ms: Date.now() - inicio },
    };
  }

  const mensajeUsuario = construirMensajeUsuario(perfil);

  let texto: string;
  let uso: { input_tokens?: number; output_tokens?: number } = {};

  try {
    const respuesta = await invocar(mensajeUsuario, true);
    texto = respuesta.texto;
    uso = respuesta.uso;
  } catch (error) {
    if (!esErrorDeStructuredOutputs(error)) throw traducirError(error);
    // El modelo o la región no aceptan output_config.format: reintentamos sin él.
    const respuesta = await invocar(mensajeUsuario, false).catch((e) => {
      throw traducirError(e);
    });
    texto = respuesta.texto;
    uso = respuesta.uso;
  }

  const crudo = extraerJson(texto);
  const validado = rutaSchema.safeParse(crudo);

  if (!validado.success) {
    throw new ErrorBedrock(
      "El modelo devolvió una ruta con formato inesperado. Vuelve a intentarlo.",
      502,
      validado.error.flatten(),
    );
  }

  return {
    ruta: normalizar(validado.data),
    meta: {
      modelo: MODEL_ID,
      origen: "bedrock",
      tokens_entrada: uso.input_tokens,
      tokens_salida: uso.output_tokens,
      ms: Date.now() - inicio,
    },
  };
}

async function invocar(mensajeUsuario: string, conSchema: boolean) {
  const outputConfig: Record<string, unknown> = { effort: EFFORT };
  if (conSchema) {
    outputConfig.format = { type: "json_schema", schema: rutaJsonSchema };
  }

  // Se usa streaming porque `max_tokens` alto en modo no-streaming puede agotar
  // el timeout HTTP del SDK antes de que el modelo termine.
  const stream = obtenerCliente().messages.stream({
    model: MODEL_ID,
    max_tokens: 16000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    thinking: { type: "adaptive" },
    output_config: outputConfig as never,
    messages: [{ role: "user", content: mensajeUsuario }],
  });

  const mensaje = await stream.finalMessage();

  if (mensaje.stop_reason === "refusal") {
    throw new ErrorBedrock("El modelo declinó responder a esta solicitud.", 422);
  }

  const texto = mensaje.content
    .filter((bloque): bloque is Extract<typeof bloque, { type: "text" }> => bloque.type === "text")
    .map((bloque) => bloque.text)
    .join("");

  if (!texto.trim()) {
    throw new ErrorBedrock("El modelo no devolvió contenido.", 502);
  }

  return {
    texto,
    uso: {
      input_tokens: mensaje.usage?.input_tokens,
      output_tokens: mensaje.usage?.output_tokens,
    },
  };
}

/** Extrae el objeto JSON aunque venga envuelto en ```json ... ``` o con texto alrededor. */
function extraerJson(texto: string): unknown {
  const limpio = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  try {
    return JSON.parse(limpio);
  } catch {
    const inicio = limpio.indexOf("{");
    const fin = limpio.lastIndexOf("}");
    if (inicio !== -1 && fin > inicio) {
      try {
        return JSON.parse(limpio.slice(inicio, fin + 1));
      } catch {
        /* cae al throw de abajo */
      }
    }
    throw new ErrorBedrock("No se pudo interpretar la respuesta del modelo como JSON.", 502);
  }
}

/** Renumera semanas y recalcula totales por si el modelo se desalinea. */
function normalizar(ruta: Ruta): Ruta {
  const semanas = ruta.ruta.map((semana, indice) => ({ ...semana, semana: indice + 1 }));
  const horasCalculadas = semanas.reduce(
    (total, semana) => total + semana.recursos.reduce((acc, r) => acc + (r.horas_estimadas ?? 0), 0),
    0,
  );

  return {
    ...ruta,
    ruta: semanas,
    duracion_semanas: semanas.length,
    tiempo_estudio_estimado_horas:
      horasCalculadas > 0 ? Math.round(horasCalculadas) : ruta.tiempo_estudio_estimado_horas,
  };
}

function esErrorDeStructuredOutputs(error: unknown): boolean {
  const mensaje = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number } | null)?.status;
  return status === 400 && /output_config|json_schema|structured|format/i.test(mensaje);
}

function traducirError(error: unknown): ErrorBedrock {
  if (error instanceof ErrorBedrock) return error;

  const status = (error as { status?: number } | null)?.status;
  const mensaje = error instanceof Error ? error.message : String(error);

  if (status === 403 || /AccessDenied|not authorized|security token/i.test(mensaje)) {
    return new ErrorBedrock(
      `Sin acceso a Bedrock en ${REGION}. Verifica credenciales y que el modelo ${MODEL_ID} esté habilitado en la consola de Bedrock.`,
      403,
      mensaje,
    );
  }
  if (status === 404 || /ValidationException|model.*not.*found/i.test(mensaje)) {
    return new ErrorBedrock(
      `El modelo ${MODEL_ID} no está disponible en ${REGION}. Cambia BEDROCK_MODEL_ID o la región.`,
      404,
      mensaje,
    );
  }
  if (status === 429) {
    return new ErrorBedrock("Bedrock está limitando las peticiones. Espera unos segundos.", 429, mensaje);
  }

  return new ErrorBedrock("Error al generar la ruta con Amazon Bedrock.", 502, mensaje);
}

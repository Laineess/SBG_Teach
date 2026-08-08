import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";
import { ErrorBedrock, generarRuta } from "./bedrock.js";
import { perfilSchema } from "./schema.js";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";

const headersBase: Record<string, string> = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": CORS_ORIGIN,
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST,OPTIONS",
};

/**
 * Función `generateLearningPath`.
 * Ruta: POST /ruta  (Amazon API Gateway HTTP API)
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context?: Context,
): Promise<APIGatewayProxyResultV2> => {
  const metodo = event.requestContext?.http?.method ?? "POST";

  if (metodo === "OPTIONS") {
    return { statusCode: 204, headers: headersBase, body: "" };
  }

  if (metodo === "GET") {
    return responder(200, { ok: true, servicio: "aws-uaemex-study-path-coach" });
  }

  if (metodo !== "POST") {
    return responder(405, { error: "Método no permitido." });
  }

  let cuerpo: unknown;
  try {
    const crudo = event.isBase64Encoded && event.body
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    cuerpo = JSON.parse(crudo ?? "{}");
  } catch {
    return responder(400, { error: "El cuerpo de la petición no es JSON válido." });
  }

  const perfil = perfilSchema.safeParse(cuerpo);
  if (!perfil.success) {
    return responder(400, {
      error: "El perfil enviado no es válido.",
      detalles: perfil.error.flatten().fieldErrors,
    });
  }

  try {
    const resultado = await generarRuta(perfil.data);
    console.log(
      JSON.stringify({
        evento: "ruta_generada",
        requestId: context?.awsRequestId,
        carrera: perfil.data.carrera,
        semestre: perfil.data.semestre,
        nivel: perfil.data.nivel_actual_aws,
        ...resultado.meta,
      }),
    );
    return responder(200, resultado);
  } catch (error) {
    const esConocido = error instanceof ErrorBedrock;
    console.error(
      JSON.stringify({
        evento: "error_generacion",
        requestId: context?.awsRequestId,
        mensaje: error instanceof Error ? error.message : String(error),
        causa: esConocido ? error.causa : undefined,
      }),
    );
    return responder(esConocido ? error.status : 500, {
      error: esConocido ? error.message : "Error interno al generar la ruta.",
    });
  }
};

function responder(statusCode: number, cuerpo: unknown): APIGatewayProxyResultV2 {
  return { statusCode, headers: headersBase, body: JSON.stringify(cuerpo) };
}

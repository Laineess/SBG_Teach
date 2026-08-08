/**
 * Servidor de desarrollo local. Emula el contrato de Amazon API Gateway (HTTP API)
 * reutilizando exactamente el mismo `handler` que corre en Lambda, para que lo que
 * pruebas en local sea lo que se despliega.
 */
import "dotenv/config";
import cors from "cors";
import express from "express";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "./handler.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/salud", (_req, res) => {
  res.json({
    ok: true,
    region: process.env.AWS_REGION ?? "us-east-1",
    modelo: process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-opus-5",
    mock: process.env.MOCK === "1" || process.env.MOCK === "true",
  });
});

app.post("/ruta", async (req, res) => {
  const evento = {
    version: "2.0",
    routeKey: "POST /ruta",
    rawPath: "/ruta",
    headers: req.headers as Record<string, string>,
    requestContext: { http: { method: "POST", path: "/ruta" } },
    body: JSON.stringify(req.body ?? {}),
    isBase64Encoded: false,
  } as unknown as APIGatewayProxyEventV2;

  const resultado = await handler(evento);

  if (typeof resultado === "string") {
    res.status(200).send(resultado);
    return;
  }

  res
    .status(resultado.statusCode ?? 200)
    .set(resultado.headers as Record<string, string>)
    .send(resultado.body ?? "");
});

const servidor = app.listen(PORT, () => {
  const modo = process.env.MOCK === "1" || process.env.MOCK === "true" ? "MOCK (sin Bedrock)" : "Bedrock";
  console.log(`API local en http://localhost:${PORT}  —  modo: ${modo}`);
  console.log(`  POST http://localhost:${PORT}/ruta`);
  console.log(`  GET  http://localhost:${PORT}/salud`);
});

servidor.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `\nEl puerto ${PORT} ya está ocupado por otra aplicación.\n` +
        `Elige otro puerto en backend/.env (por ejemplo PORT=3002) y ajusta el proxy\n` +
        `en frontend/vite.config.ts para que apunte al mismo puerto.\n`,
    );
    process.exit(1);
  }
  throw error;
});

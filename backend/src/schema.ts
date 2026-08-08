import { z } from "zod";

/** Perfil del estudiante — lo que envía el frontend. */
export const perfilSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  carrera: z.string().trim().min(1, "La carrera es obligatoria").max(120),
  semestre: z.coerce.number().int().min(1).max(14),
  experiencia_cloud: z.enum(["ninguna", "básica", "intermedia", "avanzada"]),
  experiencia_ia: z.enum(["ninguna", "básica", "intermedia"]),
  objetivo: z.string().trim().min(3, "Describe tu objetivo").max(300),
  tiempo_por_semana_horas: z.coerce.number().int().min(1).max(40),
  nivel_actual_aws: z.union([z.literal(100), z.literal(200), z.literal(300)]),
});

export type Perfil = z.infer<typeof perfilSchema>;

/** Un recurso dentro de una semana de la ruta. */
export const recursoSchema = z.object({
  tipo: z.enum(["curso", "lab", "evento_builder_group", "proyecto", "certificacion"]),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  link: z.string().optional(),
  horas_estimadas: z.number().optional(),
});

export const semanaSchema = z.object({
  semana: z.number().int().min(1),
  nivel: z.union([z.literal(100), z.literal(200), z.literal(300)]),
  tema: z.string().min(1),
  objetivo_semana: z.string().optional(),
  recursos: z.array(recursoSchema).min(1),
});

/** Ruta generada — el contrato de salida de Bedrock y de la API. */
export const rutaSchema = z.object({
  perfil_resumen: z.string().min(1),
  duracion_semanas: z.number().int().min(4).max(12),
  ruta: z.array(semanaSchema).min(1),
  siguiente_certificacion_sugerida: z.string().min(1),
  tiempo_estudio_estimado_horas: z.number(),
  consejos: z.array(z.string()).optional(),
});

export type Recurso = z.infer<typeof recursoSchema>;
export type Semana = z.infer<typeof semanaSchema>;
export type Ruta = z.infer<typeof rutaSchema>;

/**
 * JSON Schema para structured outputs de Bedrock.
 * Se mantiene alineado a mano con `rutaSchema` (arriba) porque el API exige
 * `additionalProperties: false` y no admite todas las restricciones de Zod.
 */
export const rutaJsonSchema = {
  type: "object",
  properties: {
    perfil_resumen: { type: "string" },
    duracion_semanas: { type: "integer" },
    ruta: {
      type: "array",
      items: {
        type: "object",
        properties: {
          semana: { type: "integer" },
          nivel: { type: "integer", enum: [100, 200, 300] },
          tema: { type: "string" },
          objetivo_semana: { type: "string" },
          recursos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tipo: {
                  type: "string",
                  enum: ["curso", "lab", "evento_builder_group", "proyecto", "certificacion"],
                },
                nombre: { type: "string" },
                descripcion: { type: "string" },
                link: { type: "string" },
                horas_estimadas: { type: "number" },
              },
              required: ["tipo", "nombre", "descripcion"],
              additionalProperties: false,
            },
          },
        },
        required: ["semana", "nivel", "tema", "objetivo_semana", "recursos"],
        additionalProperties: false,
      },
    },
    siguiente_certificacion_sugerida: { type: "string" },
    tiempo_estudio_estimado_horas: { type: "number" },
    consejos: { type: "array", items: { type: "string" } },
  },
  required: [
    "perfil_resumen",
    "duracion_semanas",
    "ruta",
    "siguiente_certificacion_sugerida",
    "tiempo_estudio_estimado_horas",
    "consejos",
  ],
  additionalProperties: false,
} as const;

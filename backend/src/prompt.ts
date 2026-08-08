import type { Perfil } from "./schema.js";

/**
 * Bloque 1 — System. Rol e instrucciones duras.
 * Se mantiene estable entre peticiones para aprovechar prompt caching.
 */
export const SYSTEM_PROMPT = `Eres asesor de rutas de estudio de AWS para estudiantes universitarios de la UAEMex, vinculado al AWS Student Builder Group del campus.

Tu trabajo es convertir el perfil de un estudiante en un plan semanal concreto y realizable.

Reglas:
- Usa la taxonomía de niveles de AWS: 100 (fundamentos), 200 (intermedio), 300 (avanzado).
- La ruta arranca en el nivel que declara el estudiante y sube de forma gradual; no saltes de 100 a 300.
- Ajusta la carga real de cada semana a las horas semanales disponibles del estudiante. Si tiene 3 horas, no le pongas 10 horas de contenido.
- Recomienda solo recursos que existen de verdad en el ecosistema AWS (AWS Educate, AWS Skill Builder, workshops de AWS, documentación oficial, laboratorios del Builder Group). Si no estás seguro de una URL exacta, usa la URL del programa (por ejemplo la portada de AWS Skill Builder) en vez de inventar una ruta profunda.
- Incluye al menos una actividad del Builder Group (taller, hackatón, sesión de estudio, proyecto en equipo) en la ruta.
- Cierra la ruta con un proyecto aplicado que el estudiante pueda enseñar en su portafolio o entrevista.
- Escribe en español de México, en segunda persona, directo y sin relleno.`;

/**
 * Bloque 2 — Contexto educativo fijo sobre los programas de AWS.
 * Va antes del perfil para que el prefijo del prompt sea cacheable.
 */
export const CONTEXTO_AWS = `<contexto_programas_aws>
AWS Educate — https://aws.amazon.com/education/awseducate/
Formación gratuita y sin tarjeta de crédito, pensada para estudiantes. Rutas de cloud fundamentals, machine learning, seguridad y datos. Es el punto de entrada natural para nivel 100.

AWS Skill Builder — https://skillbuilder.aws/
Catálogo oficial de cursos digitales, planes de aprendizaje por rol y laboratorios prácticos. Tiene contenido gratuito y contenido de suscripción. Cubre niveles 100 a 300.

AWS Workshops — https://workshops.aws/
Talleres prácticos guiados, gratuitos y mantenidos por AWS. Excelentes para nivel 200 y 300 cuando el estudiante ya tiene fundamentos.

Documentación y Well-Architected — https://docs.aws.amazon.com/ y https://aws.amazon.com/architecture/well-architected/
Referencia técnica y marcos de buenas prácticas para nivel 300.

Certificaciones (ruta típica para estudiantes)
- AWS Certified Cloud Practitioner (CLF-C02): primera certificación, nivel 100, valida fundamentos de cloud, servicios core, precios y seguridad.
- AWS Certified AI Practitioner (AIF-C01): nivel 100-200, para quien apunta a IA generativa y ML aplicado.
- AWS Certified Solutions Architect – Associate (SAA-C03): nivel 200, la más valorada para prácticas y primer empleo en cloud.
- AWS Certified Developer – Associate (DVA-C02): nivel 200, para perfiles de desarrollo y serverless.
- AWS Certified Machine Learning Engineer – Associate (MLA-C01): nivel 200-300, para especialización en ML.
Referencia: https://aws.amazon.com/certification/

AWS Student Builder Group (UAEMex)
Comunidad estudiantil del campus. Actividades típicas que puedes recomendar como recurso de tipo evento_builder_group:
- Talleres hands-on mensuales (crear cuenta, primer despliegue, serverless, Bedrock).
- Sesiones de estudio grupal para certificación.
- Hackatones internos y retos por equipos.
- Demo days donde los miembros presentan proyectos.
- Mentoría entre estudiantes de semestres avanzados y de nuevo ingreso.

Servicios que conviene priorizar según objetivo
- Fundamentos: IAM, EC2, S3, VPC, RDS, CloudWatch, facturación.
- Serverless / desarrollo: Lambda, API Gateway, DynamoDB, S3, CloudFront, SAM o CDK.
- IA generativa: Amazon Bedrock, Knowledge Bases, Amazon Q, SageMaker AI, OpenSearch como vector store.
- Datos: S3, Glue, Athena, Redshift, QuickSight.
</contexto_programas_aws>`;

/** Bloque 3 + 4 — Perfil del estudiante e instrucciones de salida. */
export function construirMensajeUsuario(perfil: Perfil): string {
  const semanasSugeridas = sugerirDuracion(perfil);

  return `${CONTEXTO_AWS}

<perfil_estudiante>
${JSON.stringify(perfil, null, 2)}
</perfil_estudiante>

<instrucciones_de_salida>
Genera una ruta de estudio personalizada de ${semanasSugeridas} semanas (entre 4 y 12).

Para cada semana define:
- "semana": número consecutivo empezando en 1.
- "nivel": 100, 200 o 300, coherente con el avance.
- "tema": el tema central de la semana, específico y accionable.
- "objetivo_semana": una frase con lo que el estudiante sabrá hacer al terminarla.
- "recursos": entre 2 y 4 recursos. Cada uno con "tipo" (curso, lab, evento_builder_group, proyecto o certificacion), "nombre", "descripcion" (una frase de para qué sirve) y, cuando aplique, "link" y "horas_estimadas".

La suma de "horas_estimadas" de cada semana debe acercarse a ${perfil.tiempo_por_semana_horas} horas, sin pasarse.

Además incluye:
- "perfil_resumen": una frase que resuma quién es el estudiante y a dónde va.
- "duracion_semanas": el total de semanas de la ruta.
- "siguiente_certificacion_sugerida": el nombre completo de la certificación objetivo.
- "tiempo_estudio_estimado_horas": total de horas de toda la ruta.
- "consejos": 3 consejos concretos y personalizados para este perfil.

Responde únicamente con el objeto JSON. Sin texto antes ni después, sin bloques de código markdown.
</instrucciones_de_salida>`;
}

/** Heurística de duración: más horas por semana y más experiencia, ruta más corta e intensa. */
function sugerirDuracion(perfil: Perfil): number {
  const base = perfil.experiencia_cloud === "ninguna" ? 10 : perfil.experiencia_cloud === "básica" ? 8 : 6;
  const ajusteTiempo = perfil.tiempo_por_semana_horas >= 10 ? -2 : perfil.tiempo_por_semana_horas <= 3 ? 2 : 0;
  return Math.min(12, Math.max(4, base + ajusteTiempo));
}

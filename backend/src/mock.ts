import type { Perfil, Ruta } from "./schema.js";

/**
 * Ruta de ejemplo determinista. Se usa cuando MOCK=1, para poder mostrar la demo
 * sin credenciales de AWS o si el modelo no está habilitado en la región del evento.
 */
export function rutaDeEjemplo(perfil: Perfil): Ruta {
  const horas = perfil.tiempo_por_semana_horas;
  const cert =
    perfil.experiencia_ia !== "ninguna" || /ia|inteligencia|machine|ml/i.test(perfil.objetivo)
      ? "AWS Certified AI Practitioner (AIF-C01)"
      : perfil.nivel_actual_aws >= 200
        ? "AWS Certified Solutions Architect – Associate (SAA-C03)"
        : "AWS Certified Cloud Practitioner (CLF-C02)";

  const semanas: Ruta["ruta"] = [
    {
      semana: 1,
      nivel: 100,
      tema: "Fundamentos de cloud y modelo de responsabilidad compartida",
      objetivo_semana: "Explicar qué es la nube, crear tu cuenta y moverte por la consola de AWS sin miedo.",
      recursos: [
        {
          tipo: "curso",
          nombre: "AWS Educate — Introduction to Cloud 101",
          descripcion: "Ruta introductoria gratuita para entender el modelo de nube y los servicios core.",
          link: "https://aws.amazon.com/education/awseducate/",
          horas_estimadas: Math.max(2, horas - 2),
        },
        {
          tipo: "evento_builder_group",
          nombre: "Taller de arranque del AWS Student Builder Group UAEMex",
          descripcion: "Sesión hands-on para crear tu cuenta, configurar alertas de facturación y activar MFA.",
          horas_estimadas: 2,
        },
      ],
    },
    {
      semana: 2,
      nivel: 100,
      tema: "Cómputo, almacenamiento y redes: EC2, S3 y VPC",
      objetivo_semana: "Levantar una instancia EC2, servir archivos desde S3 y entender qué es una VPC.",
      recursos: [
        {
          tipo: "curso",
          nombre: "AWS Skill Builder — AWS Cloud Practitioner Essentials",
          descripcion: "Curso oficial que cubre los servicios core que aparecen en la certificación.",
          link: "https://skillbuilder.aws/",
          horas_estimadas: Math.max(2, horas - 2),
        },
        {
          tipo: "lab",
          nombre: "Lab: publicar un sitio estático en S3",
          descripcion: "Práctica corta para fijar conceptos de buckets, políticas y hosting estático.",
          link: "https://workshops.aws/",
          horas_estimadas: 2,
        },
      ],
    },
    {
      semana: 3,
      nivel: 100,
      tema: "Identidad, seguridad y costos",
      objetivo_semana: "Aplicar mínimo privilegio con IAM y leer tu factura sin sorpresas.",
      recursos: [
        {
          tipo: "curso",
          nombre: "AWS Skill Builder — AWS Identity and Access Management basics",
          descripcion: "Usuarios, roles, políticas y buenas prácticas de seguridad desde el día uno.",
          link: "https://skillbuilder.aws/",
          horas_estimadas: Math.max(2, horas - 1),
        },
        {
          tipo: "evento_builder_group",
          nombre: "Sesión de estudio grupal para Cloud Practitioner",
          descripcion: "Repaso en equipo de preguntas de examen y dudas del capítulo de seguridad.",
          horas_estimadas: 1,
        },
      ],
    },
    {
      semana: 4,
      nivel: 200,
      tema: "Serverless: Lambda, API Gateway y DynamoDB",
      objetivo_semana: "Desplegar tu primera API sin servidores y guardar datos en DynamoDB.",
      recursos: [
        {
          tipo: "lab",
          nombre: "AWS Workshops — Build a serverless web application",
          descripcion: "Taller guiado end-to-end con Lambda, API Gateway y una base de datos administrada.",
          link: "https://workshops.aws/",
          horas_estimadas: Math.max(3, horas - 1),
        },
        {
          tipo: "curso",
          nombre: "AWS Skill Builder — Getting Started with Serverless",
          descripcion: "Fundamentos del modelo de eventos y del costo por uso.",
          link: "https://skillbuilder.aws/",
          horas_estimadas: 1,
        },
      ],
    },
    {
      semana: 5,
      nivel: 200,
      tema: "IA generativa aplicada con Amazon Bedrock",
      objetivo_semana: "Invocar un modelo de Bedrock desde Lambda y diseñar un prompt con salida estructurada.",
      recursos: [
        {
          tipo: "curso",
          nombre: "AWS Skill Builder — Amazon Bedrock Getting Started",
          descripcion: "Modelos disponibles, invocación desde SDK y control de costos.",
          link: "https://skillbuilder.aws/",
          horas_estimadas: Math.max(2, horas - 2),
        },
        {
          tipo: "proyecto",
          nombre: "Reto: asistente que responde con JSON validado",
          descripcion: "Replica en pequeño la arquitectura de este proyecto: formulario, Lambda y Bedrock.",
          horas_estimadas: 2,
        },
      ],
    },
    {
      semana: 6,
      nivel: 200,
      tema: "Proyecto final y preparación de certificación",
      objetivo_semana: "Cerrar un proyecto publicable y agendar tu examen.",
      recursos: [
        {
          tipo: "proyecto",
          nombre: "Proyecto de portafolio desplegado en AWS",
          descripcion: "Publica tu app con S3 + CloudFront y documenta la arquitectura en el README.",
          horas_estimadas: Math.max(3, horas - 1),
        },
        {
          tipo: "certificacion",
          nombre: cert,
          descripcion: "Agenda el examen y haz un simulacro completo antes de presentarlo.",
          link: "https://aws.amazon.com/certification/",
          horas_estimadas: 1,
        },
        {
          tipo: "evento_builder_group",
          nombre: "Demo day del Builder Group",
          descripcion: "Presenta tu proyecto ante la comunidad y recibe retroalimentación.",
          horas_estimadas: 1,
        },
      ],
    },
  ];

  return {
    perfil_resumen: `${perfil.nombre}, ${perfil.semestre}° semestre de ${perfil.carrera}, experiencia ${perfil.experiencia_cloud} en cloud. Objetivo: ${perfil.objetivo}.`,
    duracion_semanas: semanas.length,
    ruta: semanas,
    siguiente_certificacion_sugerida: cert,
    tiempo_estudio_estimado_horas: semanas.length * horas,
    consejos: [
      `Bloquea ${horas} horas fijas en tu calendario cada semana; la constancia pesa más que las maratones.`,
      "Activa alertas de facturación en cuanto crees tu cuenta y trabaja siempre dentro de la capa gratuita.",
      "Documenta cada práctica en un repositorio público: es lo primero que revisa un reclutador de cloud.",
    ],
  };
}

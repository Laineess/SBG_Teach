# AWS UAEMex Study Path Coach

Core context document for the hackathon project and future AWS Student Builder Group usage.

## 1. Proyecto en una frase

Coach de rutas de estudio AWS para estudiantes UAEMex: recibe el perfil del alumno y genera automáticamente un plan semanal (niveles 100/200/300, cursos y recursos de AWS, actividades del Builder Group y certificaciones sugeridas) usando Lambda + Amazon Bedrock.

## 2. Problema que resuelve

- Los estudiantes tienen muchos recursos de AWS (Educate, Training, certificaciones, talleres del Builder Group) pero no saben por dónde empezar.
- Cada alumno tiene contexto distinto: carrera, semestre, experiencia en cloud/IA y objetivos (prácticas, primer empleo, certificación, especialización en IA).
- Hoy la mayoría solo "pregunta a una IA" de forma genérica, sin estructura ni seguimiento.

## 3. Solución propuesta

- Web app donde el estudiante llena un formulario con su perfil.
- Backend serverless (API Gateway + Lambda) que orquesta una llamada a Amazon Bedrock.
- Bedrock genera una ruta personalizada en formato JSON:
  - Duración (semanas).
  - Nivel por semana (100, 200, 300).
  - Tema principal de cada semana.
  - Lista de recursos por semana: cursos AWS Educate/Training, labs, eventos del Builder Group, proyectos.
  - Certificación sugerida (Cloud Practitioner, AI Practitioner, etc.).
- El frontend muestra la ruta en una tabla clara y exportable/compartible.

## 4. Datos de entrada (perfil del estudiante)

JSON de entrada ejemplo:

```json
{
  "nombre": "Ana",
  "carrera": "Ingeniería en Computación",
  "semestre": 5,
  "experiencia_cloud": "básica",
  "experiencia_ia": "ninguna",
  "objetivo": "conseguir prácticas profesionales de cloud",
  "tiempo_por_semana_horas": 5,
  "nivel_actual_aws": 100
}
```

Campos clave:

- carrera
- semestre
- experiencia_cloud (ninguna, básica, intermedia, avanzada)
- experiencia_ia (ninguna, básica, intermedia)
- objetivo (prácticas, primer empleo, certificación, aprender IA, etc.)
- tiempo_por_semana_horas
- nivel_actual_aws (100, 200, 300)

## 5. Formato de salida (ruta generada)

Estructura JSON deseada desde Bedrock:

```json
{
  "perfil_resumen": "Ana, 5to semestre, experiencia básica en cloud, objetivo: prácticas en cloud.",
  "duracion_semanas": 8,
  "ruta": [
    {
      "semana": 1,
      "nivel": 100,
      "tema": "Fundamentos de cloud y AWS",
      "recursos": [
        {
          "tipo": "curso",
          "nombre": "AWS Educate - Cloud Foundations",
          "link": "https://aws.amazon.com/education/awseducate/"
        },
        {
          "tipo": "evento_builder_group",
          "nombre": "Taller introductorio AWS en Builder Group",
          "descripcion": "Sesión hands-on organizada en UAEMex"
        }
      ]
    },
    {
      "semana": 2,
      "nivel": 100,
      "tema": "Servicios básicos: compute, storage, databases",
      "recursos": [
        {
          "tipo": "curso",
          "nombre": "Ruta Cloud Basics en AWS Educate",
          "link": "https://aws.amazon.com/education/awseducate/"
        }
      ]
    }
  ],
  "siguiente_certificacion_sugerida": "AWS Certified Cloud Practitioner",
  "tiempo_estudio_estimado_horas": 30
}
```

## 6. Arquitectura mínima (hackathon)

Componentes principales:

- **Frontend estático** (HTML/JS, opcionalmente S3 + CloudFront)
  - Formulario para capturar perfil.
  - Tabla para mostrar ruta.
- **Amazon API Gateway (HTTP API)**
  - Endpoint `POST /ruta` que recibe el JSON del estudiante.
- **AWS Lambda** (función `generateLearningPath`)
  - Lee el cuerpo de la petición.
  - Arma el prompt con:
    - instrucciones de sistema,
    - contexto educativo fijo (AWS Educate, Training, Builder Group, certificaciones),
    - perfil del estudiante.
  - Llama al modelo de Amazon Bedrock.
  - Parsea la respuesta JSON, valida mínima estructura y devuelve la ruta.
- **Amazon Bedrock**
  - Modelo de texto (Claude / Nova Lite, según lo que esté disponible en la región del evento).

Flujo:

1. Usuario envía perfil desde frontend a `POST /ruta`.
2. API Gateway invoca Lambda.
3. Lambda construye prompt y llama a Bedrock.
4. Bedrock devuelve JSON con ruta.
5. Lambda responde JSON al frontend.
6. Frontend renderiza la tabla de semanas/niveles/recursos.

## 7. Servicios para escalabilidad y búsqueda masiva

Para una versión extendida del proyecto (post-hackathon, Builder Group):

- **Amazon Bedrock Knowledge Bases**
  - Conecta modelos de Bedrock a tus datos (S3, vector stores, etc.).
  - Permite RAG: recuperar contenidos reales (guías de cursos, documentación, materiales de talleres) y usarlos como contexto antes de generar rutas.
- **Amazon OpenSearch Service**
  - Servicio administrado de búsqueda y analítica sobre grandes volúmenes de datos.
  - Útil para indexar muchos recursos (cursos, labs, eventos, feedback de estudiantes) y hacer consultas masivas.
  - Puede actuar como vector store para búsquedas semánticas y RAG.
- **Amazon DynamoDB**
  - Persistencia de perfiles y rutas generadas.
  - Métricas por carrera, semestre, objetivos, etc.
- **Amazon CloudWatch**
  - Logs y métricas de Lambda, monitoreo de uso y errores.

Arquitectura extendida (idea):

- S3 almacena documentos educativos (PDFs, guías, contenidos de talleres).
- Bedrock Knowledge Base + OpenSearch indexan esos contenidos.
- Lambda recibe perfil, hace `Retrieve` a la KB, arma prompt con contenido + perfil y llama a Bedrock.
- Bedrock genera ruta apoyada en datos reales.

## 8. Diseño de prompt (versión base)

Bloques recomendados:

1. **System**
   - Rol: asesor de rutas de estudio AWS para estudiantes universitarios.
   - Instrucciones: usar niveles 100/200/300, responder solo con JSON, considerar programas educativos de AWS.
2. **Contexto**
   - Información fija sobre:
     - AWS Educate (rutas gratuitas de cloud/IA).
     - AWS Training / Skill Builder (cursos digitales).
     - Certificaciones iniciales (Cloud Practitioner, AI Practitioner) y siguientes.
     - Actividades del AWS Student Builder Group (talleres, hackatones, proyectos).
3. **Perfil del estudiante**
   - Pegado como JSON tal cual lo envía el frontend.
4. **Instrucciones de salida**
   - Generar ruta de 4–12 semanas.
   - Usar niveles 100/200/300 según experiencia.
   - Incluir recursos `curso`, `lab`, `evento_builder_group`, `proyecto`.
   - Devolver exactamente el esquema JSON acordado.

## 9. Roles de equipo (referencia)

Pensado para equipo de 5:

- **Arquitecto / Líder**
  - Define alcance, usuario objetivo y diagrama de arquitectura.
  - Coordina decisiones de prioridad por tiempo.
- **Backend (Lambda)**
  - Implementa función `generateLearningPath`.
  - Integra con API Gateway y Bedrock.
- **Prompt Engineer / Bedrock**
  - Diseña y refina prompt.
  - Prueba distintos perfiles y ajusta estructura.
- **Frontend / UX**
  - Construye formulario y vista de tabla.
  - Se asegura de que la demo sea clara.
- **Pitch / Documentación**
  - Escribe README, descripción del proyecto, prepara pitch y guion de demo.

## 10. Valor añadido frente a "solo preguntar a una IA"

- Caso de uso específico: rutas AWS para estudiantes UAEMex, no chat genérico.
- Estructura consistente: siempre JSON con semanas/niveles/recursos, fácil de seguir y medir.
- Integración con ecosistema AWS y comunidad (Educate, Training, Builder Group).
- Experiencia de usuario fluida: formulario sencillo → ruta lista, sin necesidad de que cada estudiante formule prompts complejos.
- Listo para evolucionar a producto del Builder Group y escalar a otros campus.

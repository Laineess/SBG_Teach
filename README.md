# AWS UAEMex Study Path Coach

Web app que convierte el perfil de un estudiante en una **ruta de estudio de AWS semana por semana**: niveles 100/200/300, cursos de AWS Educate y Skill Builder, laboratorios, actividades del Student Builder Group y la certificación que le conviene presentar.

Arquitectura serverless: **Frontend estático → Amazon API Gateway → AWS Lambda → Amazon Bedrock**.

El documento de diseño del proyecto está en [aws-core-context.md](aws-core-context.md).

---

## Arquitectura

```
Navegador (React + Vite)
        │  POST /ruta  { perfil del estudiante }
        ▼
Amazon API Gateway (HTTP API)
        │
        ▼
AWS Lambda  ·  generateLearningPath
        │  system prompt + contexto de programas AWS + perfil
        ▼
Amazon Bedrock  (Claude, salida estructurada JSON)
        │
        ▼
Lambda valida con Zod y responde  { ruta, meta }
        │
        ▼
Frontend renderiza el plan, permite marcar avance y exportar
```

Hosting del frontend: **Amazon S3 + CloudFront** (incluido en la plantilla de infraestructura).

---

## Estructura

```
.
├── backend/            Lambda + servidor local de desarrollo
│   └── src/
│       ├── handler.ts    Handler de Lambda (API Gateway HTTP API v2)
│       ├── server.ts     Express local que reutiliza el mismo handler
│       ├── bedrock.ts    Cliente de Bedrock, reintentos y normalización
│       ├── prompt.ts     System prompt + contexto AWS + instrucciones
│       ├── schema.ts     Contratos de entrada/salida (Zod + JSON Schema)
│       └── mock.ts       Ruta de ejemplo para demo sin credenciales
├── frontend/           React 19 + Vite 6 + Tailwind 4
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── components/   PerfilForm, RutaVista
│       └── lib/          Exportar a Markdown / JSON
├── infra/
│   └── template.yaml   AWS SAM: Lambda, HTTP API, S3, CloudFront
└── aws-core-context.md Documento de diseño
```

---

## Correr en local

Requisitos: Node.js 20+.

```bash
npm install
cp .env.example backend/.env      # en Windows: copy .env.example backend\.env
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000 (`POST /ruta`, `GET /salud`)

Vite proxea `/api` hacia la API local, así que no hay que configurar CORS en desarrollo.

### Modo demo sin AWS

Si no hay credenciales o el modelo aún no está habilitado, en `backend/.env`:

```
MOCK=1
```

La API devuelve una ruta de ejemplo coherente con el perfil enviado. La demo funciona igual.

### Modo real con Bedrock

En `backend/.env`:

```
MOCK=0
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-opus-5
BEDROCK_EFFORT=medium
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Antes de la demo, verifica en la consola de Amazon Bedrock → **Model access** que el modelo esté habilitado en esa región. Si el modelo del evento es otro, solo cambia `BEDROCK_MODEL_ID` (los IDs de Bedrock llevan prefijo `anthropic.`).

---

## Contrato de la API

### `POST /ruta`

Entrada:

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

Salida:

```json
{
  "ruta": {
    "perfil_resumen": "Ana, 5° semestre…",
    "duracion_semanas": 8,
    "ruta": [
      {
        "semana": 1,
        "nivel": 100,
        "tema": "Fundamentos de cloud y AWS",
        "objetivo_semana": "…",
        "recursos": [
          {
            "tipo": "curso",
            "nombre": "AWS Educate — Cloud Foundations",
            "descripcion": "…",
            "link": "https://aws.amazon.com/education/awseducate/",
            "horas_estimadas": 3
          }
        ]
      }
    ],
    "siguiente_certificacion_sugerida": "AWS Certified Cloud Practitioner",
    "tiempo_estudio_estimado_horas": 30,
    "consejos": ["…"]
  },
  "meta": { "modelo": "anthropic.claude-opus-5", "origen": "bedrock", "ms": 12400 }
}
```

Códigos de error: `400` perfil inválido (incluye `detalles` por campo), `403` sin acceso a Bedrock, `404` modelo no disponible en la región, `429` throttling, `502` respuesta del modelo no interpretable.

---

## Desplegar en AWS

Requisitos: AWS CLI y AWS SAM CLI configurados.

```bash
# 1. Backend + infraestructura
sam build --template infra/template.yaml
sam deploy --guided --template infra/template.yaml
```

Anota los outputs `ApiUrl`, `SitioBucketNombre` y `SitioUrl`.

```bash
# 2. Frontend apuntando a la API desplegada
cd frontend
VITE_API_URL=https://<ApiUrl> npm run build
aws s3 sync dist/ s3://<SitioBucketNombre> --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

Para endurecer CORS, redespliega con `--parameter-overrides OrigenCors=https://<SitioUrl>`.

---

## Decisiones de diseño

**Un solo handler para Lambda y para local.** `server.ts` construye un evento de API Gateway v2 y llama al mismo `handler` que corre en producción. Lo que se prueba en local es exactamente lo que se despliega.

**Salida estructurada con reintento.** Se pide `output_config.format` con JSON Schema para que Bedrock garantice la forma del JSON. Si la región o el modelo no lo soportan, la Lambda reintenta sin ese parámetro y extrae el JSON del texto. En ambos casos la respuesta se valida con Zod antes de salir: el frontend nunca recibe una ruta malformada.

**El prompt está partido en bloques estables y variables.** El system prompt y el contexto de programas AWS no cambian entre peticiones y llevan `cache_control`, así que el prompt caching de Bedrock abarata las invocaciones repetidas de la demo. Solo el perfil del estudiante varía.

**Normalización post-modelo.** La Lambda renumera semanas y recalcula el total de horas a partir de los recursos, para que la ruta sea internamente consistente aunque el modelo se desalinee.

**Modo mock de primera clase.** Una demo de hackatón no puede depender de que haya acceso al modelo en la región del evento. `MOCK=1` produce una ruta real y coherente con el perfil, sin llamar a Bedrock.

---

## Evolución (post-hackatón)

Lo que ya está preparado para crecer, siguiendo el documento de diseño:

- **Amazon DynamoDB** — persistir perfiles y rutas; métricas por carrera y semestre.
- **Bedrock Knowledge Bases + Amazon OpenSearch** — RAG sobre materiales reales del Builder Group en S3, para que las rutas citen contenidos propios en vez de recursos genéricos.
- **Amazon Cognito** — cuentas de estudiante y seguimiento real del avance (hoy el progreso vive solo en el navegador).
- **Amazon CloudWatch** — la Lambda ya emite logs estructurados en JSON (`ruta_generada`, `error_generacion`) listos para métricas y dashboards.

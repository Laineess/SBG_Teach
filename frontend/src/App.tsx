import { useRef, useState } from "react";
import { ErrorApi, solicitarRuta } from "./api";
import { PerfilForm } from "./components/PerfilForm";
import { RutaVista } from "./components/RutaVista";
import type { Perfil, RespuestaRuta } from "./types";

type Estado =
  | { fase: "inicial" }
  | { fase: "cargando" }
  | { fase: "listo"; datos: RespuestaRuta; perfil: Perfil }
  | { fase: "error"; mensaje: string; detalles?: Record<string, string[]> };

export default function App() {
  const [estado, setEstado] = useState<Estado>({ fase: "inicial" });
  const peticionActiva = useRef<AbortController | null>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);

  async function generar(perfil: Perfil) {
    peticionActiva.current?.abort();
    const controlador = new AbortController();
    peticionActiva.current = controlador;

    setEstado({ fase: "cargando" });

    try {
      const datos = await solicitarRuta(perfil, controlador.signal);
      setEstado({ fase: "listo", datos, perfil });
      requestAnimationFrame(() => {
        if (window.innerWidth < 1024) {
          resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setEstado({
        fase: "error",
        mensaje: error instanceof ErrorApi ? error.message : "Ocurrió un error inesperado.",
        detalles: error instanceof ErrorApi ? error.detalles : undefined,
      });
    }
  }

  return (
    <div className="min-h-screen">
      <header className="hero-grid text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
            <span className="inline-block h-1.5 w-6 rounded-full bg-orange-500" />
            AWS Student Builder Group · UAEMex
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Tu ruta de estudio de AWS,{" "}
            <span className="text-orange-500">hecha para tu semestre y tus horas</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Cuéntanos tu perfil y Amazon Bedrock arma un plan semana por semana: niveles 100, 200 y 300,
            cursos de AWS Educate y Skill Builder, laboratorios, actividades del Builder Group y la
            certificación que te conviene presentar.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            <Etiqueta>API Gateway</Etiqueta>
            <Etiqueta>AWS Lambda</Etiqueta>
            <Etiqueta>Amazon Bedrock</Etiqueta>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:py-12">
        <div className="no-imprimir lg:sticky lg:top-8 lg:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink-800">Tu perfil</h2>
            <p className="mt-1 mb-5 text-sm text-ink-600">
              Entre más específico seas, más útil sale la ruta.
            </p>
            <PerfilForm
              cargando={estado.fase === "cargando"}
              onEnviar={generar}
              erroresCampo={estado.fase === "error" ? estado.detalles : undefined}
            />
          </section>
        </div>

        <div ref={resultadoRef} className="imprimir-completo min-w-0">
          {estado.fase === "inicial" && <EstadoInicial />}
          {estado.fase === "cargando" && <EstadoCargando />}
          {estado.fase === "error" && <EstadoError mensaje={estado.mensaje} />}
          {estado.fase === "listo" && (
            <RutaVista ruta={estado.datos.ruta} perfil={estado.perfil} meta={estado.datos.meta} />
          )}
        </div>
      </main>

      <footer className="no-imprimir border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-ink-400 sm:px-6">
          Proyecto del AWS Student Builder Group UAEMex · Arquitectura serverless con Amazon API Gateway,
          AWS Lambda y Amazon Bedrock.
        </div>
      </footer>
    </div>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className="h-1 w-1 rounded-full bg-orange-500" />
      {children}
    </span>
  );
}

function EstadoInicial() {
  const pasos = [
    { titulo: "Llenas tu perfil", texto: "Carrera, semestre, experiencia y horas disponibles a la semana." },
    { titulo: "Bedrock arma el plan", texto: "Una Lambda construye el prompt con el contexto de los programas de AWS." },
    { titulo: "Sigues la ruta", texto: "Marca semanas como hechas, exporta a Markdown o imprime tu plan en PDF." },
  ];

  return (
    <div className="flex min-h-[420px] flex-col justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 p-8">
      <h2 className="text-xl font-bold text-ink-800">Aquí aparecerá tu ruta</h2>
      <p className="mt-1 text-sm text-ink-600">Llena el formulario y genera tu plan en segundos.</p>
      <ol className="mt-8 space-y-5">
        {pasos.map((paso, indice) => (
          <li key={paso.titulo} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-sm font-bold text-orange-500">
              {indice + 1}
            </span>
            <span>
              <span className="block font-semibold text-ink-800">{paso.titulo}</span>
              <span className="block text-sm text-ink-600">{paso.texto}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EstadoCargando() {
  return (
    <div className="animar-entrada space-y-4" role="status" aria-live="polite">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500" />
          <p className="font-semibold text-ink-800">Diseñando tu ruta con Amazon Bedrock…</p>
        </div>
        <p className="mt-2 text-sm text-ink-600">
          Estamos cruzando tu perfil con el catálogo de AWS Educate, Skill Builder y las actividades del
          Builder Group. Suele tardar entre 10 y 30 segundos.
        </p>
      </div>
      {[0, 1, 2].map((indice) => (
        <div
          key={indice}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          style={{ animationDelay: `${indice * 120}ms` }}
        >
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="mt-3 h-5 w-3/4 rounded bg-slate-200" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EstadoError({ mensaje }: { mensaje: string }) {
  return (
    <div className="animar-entrada rounded-xl border border-red-200 bg-red-50 p-6" role="alert">
      <h2 className="font-bold text-red-800">No pudimos generar tu ruta</h2>
      <p className="mt-1 text-sm text-red-700">{mensaje}</p>
      <p className="mt-4 text-xs text-red-600">
        Si estás en la demo y no hay acceso a Bedrock, levanta la API con <code>MOCK=1</code> para usar la
        ruta de ejemplo.
      </p>
    </div>
  );
}

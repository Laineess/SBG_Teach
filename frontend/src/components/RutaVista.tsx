import { useState } from "react";
import type { MetaRuta, NivelAws, Perfil, Recurso, Ruta, TipoRecurso } from "../types";
import { descargarArchivo, nombreArchivo, rutaAMarkdown } from "../lib/exportar";

interface Props {
  ruta: Ruta;
  perfil: Perfil;
  meta: MetaRuta;
}

const ESTILO_NIVEL: Record<NivelAws, { chip: string; barra: string; nombre: string }> = {
  100: { chip: "bg-teal-500/10 text-teal-700 ring-teal-500/30", barra: "bg-teal-500", nombre: "Fundamentos" },
  200: { chip: "bg-orange-500/10 text-orange-700 ring-orange-500/30", barra: "bg-orange-500", nombre: "Intermedio" },
  300: { chip: "bg-purple-500/10 text-purple-700 ring-purple-500/30", barra: "bg-purple-500", nombre: "Avanzado" },
};

const RECURSO: Record<TipoRecurso, { etiqueta: string; icono: string; clase: string }> = {
  curso: { etiqueta: "Curso", icono: "▤", clase: "bg-sky-500/10 text-sky-700" },
  lab: { etiqueta: "Lab", icono: "◆", clase: "bg-teal-500/10 text-teal-700" },
  evento_builder_group: { etiqueta: "Builder Group", icono: "◎", clase: "bg-purple-500/10 text-purple-700" },
  proyecto: { etiqueta: "Proyecto", icono: "▲", clase: "bg-orange-500/10 text-orange-700" },
  certificacion: { etiqueta: "Certificación", icono: "★", clase: "bg-ink-700/10 text-ink-700" },
};

export function RutaVista({ ruta, perfil, meta }: Props) {
  const [completadas, setCompletadas] = useState<Set<number>>(new Set());
  const [copiado, setCopiado] = useState<"json" | "md" | null>(null);

  function alternarSemana(numero: number) {
    setCompletadas((previo) => {
      const siguiente = new Set(previo);
      if (siguiente.has(numero)) siguiente.delete(numero);
      else siguiente.add(numero);
      return siguiente;
    });
  }

  async function copiar(formato: "json" | "md") {
    const texto =
      formato === "json" ? JSON.stringify(ruta, null, 2) : rutaAMarkdown(ruta, perfil);
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(formato);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      descargarArchivo(
        texto,
        nombreArchivo(perfil, formato === "json" ? "json" : "md"),
        formato === "json" ? "application/json" : "text/markdown",
      );
    }
  }

  const progreso = Math.round((completadas.size / ruta.ruta.length) * 100);

  return (
    <div className="animar-entrada space-y-6">
      {/* Resumen */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="hero-grid px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">Tu ruta personalizada</p>
          <h2 className="mt-1 text-lg font-bold leading-snug sm:text-xl">{ruta.perfil_resumen}</h2>
        </div>

        <dl className="grid grid-cols-2 divide-slate-200 sm:grid-cols-4 sm:divide-x">
          <Estadistica etiqueta="Semanas" valor={String(ruta.duracion_semanas)} />
          <Estadistica etiqueta="Horas totales" valor={`${ruta.tiempo_estudio_estimado_horas}`} />
          <Estadistica etiqueta="Ritmo" valor={`${perfil.tiempo_por_semana_horas} h/sem`} />
          <Estadistica etiqueta="Progreso" valor={`${progreso}%`} destacado />
        </dl>

        <div className="border-t border-slate-200 bg-orange-100/60 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            Certificación objetivo
          </p>
          <p className="mt-0.5 font-bold text-ink-700">{ruta.siguiente_certificacion_sugerida}</p>
        </div>
      </section>

      {/* Acciones */}
      <div className="no-imprimir flex flex-wrap gap-2">
        <BotonAccion onClick={() => copiar("md")}>
          {copiado === "md" ? "✓ Copiado" : "Copiar Markdown"}
        </BotonAccion>
        <BotonAccion onClick={() => copiar("json")}>
          {copiado === "json" ? "✓ Copiado" : "Copiar JSON"}
        </BotonAccion>
        <BotonAccion
          onClick={() =>
            descargarArchivo(rutaAMarkdown(ruta, perfil), nombreArchivo(perfil, "md"), "text/markdown")
          }
        >
          Descargar .md
        </BotonAccion>
        <BotonAccion
          onClick={() =>
            descargarArchivo(
              JSON.stringify(ruta, null, 2),
              nombreArchivo(perfil, "json"),
              "application/json",
            )
          }
        >
          Descargar .json
        </BotonAccion>
        <BotonAccion onClick={() => window.print()}>Imprimir / PDF</BotonAccion>
      </div>

      {/* Semanas */}
      <ol className="space-y-4">
        {ruta.ruta.map((semana) => {
          const estilo = ESTILO_NIVEL[semana.nivel] ?? ESTILO_NIVEL[100];
          const hecha = completadas.has(semana.semana);
          const horasSemana = semana.recursos.reduce((t, r) => t + (r.horas_estimadas ?? 0), 0);

          return (
            <li
              key={semana.semana}
              className={`semana-card overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                hecha ? "border-teal-500/40 opacity-70" : "border-slate-200"
              }`}
            >
              <div className={`h-1 w-full ${estilo.barra}`} />
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-ink-700 px-2 py-0.5 text-xs font-bold text-white">
                        Semana {semana.semana}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${estilo.chip}`}
                      >
                        Nivel {semana.nivel} · {estilo.nombre}
                      </span>
                      {horasSemana > 0 && (
                        <span className="text-xs font-medium text-ink-400">~{horasSemana} h</span>
                      )}
                    </div>
                    <h3 className={`mt-2 text-base font-bold text-ink-800 ${hecha ? "line-through" : ""}`}>
                      {semana.tema}
                    </h3>
                    {semana.objetivo_semana && (
                      <p className="mt-1 text-sm text-ink-600">{semana.objetivo_semana}</p>
                    )}
                  </div>

                  <label className="no-imprimir flex shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold text-ink-400">
                    <input
                      type="checkbox"
                      checked={hecha}
                      onChange={() => alternarSemana(semana.semana)}
                      className="h-4 w-4 cursor-pointer accent-teal-500"
                    />
                    Hecha
                  </label>
                </div>

                <ul className="mt-4 space-y-2.5">
                  {semana.recursos.map((recurso, indice) => (
                    <RecursoItem key={`${semana.semana}-${indice}`} recurso={recurso} />
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Consejos */}
      {ruta.consejos && ruta.consejos.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-ink-700 p-5 text-white shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500">Consejos para ti</h3>
          <ul className="mt-3 space-y-2">
            {ruta.consejos.map((consejo, indice) => (
              <li key={indice} className="flex gap-2.5 text-sm leading-relaxed text-slate-200">
                <span aria-hidden className="mt-0.5 shrink-0 text-orange-500">
                  →
                </span>
                {consejo}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-[11px] text-ink-400">
        Generada con {meta.origen === "mock" ? "datos de ejemplo" : `Amazon Bedrock · ${meta.modelo}`} en{" "}
        {(meta.ms / 1000).toFixed(1)} s
        {meta.tokens_salida ? ` · ${meta.tokens_salida} tokens de salida` : ""}
      </p>
    </div>
  );
}

function RecursoItem({ recurso }: { recurso: Recurso }) {
  const estilo = RECURSO[recurso.tipo] ?? RECURSO.curso;

  const contenido = (
    <>
      <span
        aria-hidden
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs ${estilo.clase}`}
      >
        {estilo.icono}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-ink-800 group-hover:text-orange-600">
            {recurso.nombre}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
            {estilo.etiqueta}
            {recurso.horas_estimadas ? ` · ${recurso.horas_estimadas} h` : ""}
          </span>
        </span>
        {recurso.descripcion && (
          <span className="mt-0.5 block text-sm leading-snug text-ink-600">{recurso.descripcion}</span>
        )}
      </span>
    </>
  );

  return (
    <li>
      {recurso.link ? (
        <a
          href={recurso.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex gap-3 rounded-lg border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50"
        >
          {contenido}
        </a>
      ) : (
        <div className="flex gap-3 p-2">{contenido}</div>
      )}
    </li>
  );
}

function Estadistica({
  etiqueta,
  valor,
  destacado,
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div className="border-b border-slate-200 px-6 py-4 last:border-b-0 sm:border-b-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{etiqueta}</dt>
      <dd
        className={`mt-0.5 text-2xl font-bold tabular-nums ${destacado ? "text-orange-600" : "text-ink-700"}`}
      >
        {valor}
      </dd>
    </div>
  );
}

function BotonAccion({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink-700 shadow-sm transition hover:border-ink-700 hover:bg-ink-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      {children}
    </button>
  );
}

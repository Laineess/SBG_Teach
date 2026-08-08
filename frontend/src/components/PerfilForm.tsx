import { useState } from "react";
import type { NivelAws, Perfil } from "../types";

interface Props {
  cargando: boolean;
  onEnviar: (perfil: Perfil) => void;
  erroresCampo?: Record<string, string[]>;
}

const PERFIL_INICIAL: Perfil = {
  nombre: "",
  carrera: "Ingeniería en Computación",
  semestre: 5,
  experiencia_cloud: "básica",
  experiencia_ia: "ninguna",
  objetivo: "",
  tiempo_por_semana_horas: 5,
  nivel_actual_aws: 100,
};

const CARRERAS = [
  "Ingeniería en Computación",
  "Ingeniería en Sistemas y Comunicaciones",
  "Ingeniería en Software",
  "Ingeniería Mecatrónica",
  "Ingeniería Electrónica",
  "Licenciatura en Informática Administrativa",
  "Licenciatura en Ciencias de la Información Documental",
  "Licenciatura en Actuaría",
  "Otra",
];

const OBJETIVOS = [
  "Conseguir prácticas profesionales de cloud",
  "Conseguir mi primer empleo en tecnología",
  "Certificarme en AWS",
  "Aprender IA generativa aplicada",
  "Fortalecer mi proyecto de titulación",
];

const NIVELES: { valor: NivelAws; titulo: string; detalle: string }[] = [
  { valor: 100, titulo: "100", detalle: "Nunca he usado AWS" },
  { valor: 200, titulo: "200", detalle: "Ya despliegue algo" },
  { valor: 300, titulo: "300", detalle: "Diseño arquitecturas" },
];

export function PerfilForm({ cargando, onEnviar, erroresCampo }: Props) {
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_INICIAL);
  const [tocado, setTocado] = useState(false);

  const faltaNombre = tocado && perfil.nombre.trim().length === 0;
  const faltaObjetivo = tocado && perfil.objetivo.trim().length < 3;

  function actualizar<K extends keyof Perfil>(campo: K, valor: Perfil[K]) {
    setPerfil((previo) => ({ ...previo, [campo]: valor }));
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setTocado(true);
    if (perfil.nombre.trim().length === 0 || perfil.objetivo.trim().length < 3) return;
    onEnviar({
      ...perfil,
      nombre: perfil.nombre.trim(),
      carrera: perfil.carrera.trim(),
      objetivo: perfil.objetivo.trim(),
    });
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <Campo etiqueta="Nombre" htmlFor="nombre" error={faltaNombre ? "Escribe tu nombre" : erroresCampo?.nombre?.[0]}>
        <input
          id="nombre"
          type="text"
          value={perfil.nombre}
          onChange={(e) => actualizar("nombre", e.target.value)}
          placeholder="Ana Rodríguez"
          autoComplete="given-name"
          className={entradaBase(faltaNombre)}
        />
      </Campo>

      <Campo etiqueta="Carrera" htmlFor="carrera" error={erroresCampo?.carrera?.[0]}>
        <select
          id="carrera"
          value={CARRERAS.includes(perfil.carrera) ? perfil.carrera : "Otra"}
          onChange={(e) => actualizar("carrera", e.target.value === "Otra" ? "" : e.target.value)}
          className={entradaBase(false)}
        >
          {CARRERAS.map((carrera) => (
            <option key={carrera} value={carrera}>
              {carrera}
            </option>
          ))}
        </select>
        {!CARRERAS.includes(perfil.carrera) && (
          <input
            type="text"
            value={perfil.carrera}
            onChange={(e) => actualizar("carrera", e.target.value)}
            placeholder="Escribe tu carrera"
            className={`${entradaBase(false)} mt-2`}
          />
        )}
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo etiqueta="Semestre" htmlFor="semestre" error={erroresCampo?.semestre?.[0]}>
          <select
            id="semestre"
            value={perfil.semestre}
            onChange={(e) => actualizar("semestre", Number(e.target.value))}
            className={entradaBase(false)}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}°
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta="Horas por semana"
          htmlFor="horas"
          error={erroresCampo?.tiempo_por_semana_horas?.[0]}
        >
          <div className="flex items-center gap-3">
            <input
              id="horas"
              type="range"
              min={1}
              max={20}
              value={perfil.tiempo_por_semana_horas}
              onChange={(e) => actualizar("tiempo_por_semana_horas", Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-orange-600"
            />
            <span className="w-12 shrink-0 rounded-md bg-ink-700 px-2 py-1 text-center text-sm font-semibold text-white tabular-nums">
              {perfil.tiempo_por_semana_horas}h
            </span>
          </div>
        </Campo>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-700">Tu nivel actual en AWS</legend>
        <div className="grid grid-cols-3 gap-2">
          {NIVELES.map((nivel) => {
            const activo = perfil.nivel_actual_aws === nivel.valor;
            return (
              <button
                key={nivel.valor}
                type="button"
                onClick={() => actualizar("nivel_actual_aws", nivel.valor)}
                aria-pressed={activo}
                className={`rounded-lg border-2 px-3 py-2.5 text-left transition ${
                  activo
                    ? "border-orange-500 bg-orange-100 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="block text-base font-bold text-ink-700">{nivel.titulo}</span>
                <span className="block text-[11px] leading-tight text-ink-400">{nivel.detalle}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Campo etiqueta="Experiencia en cloud" htmlFor="exp-cloud">
          <select
            id="exp-cloud"
            value={perfil.experiencia_cloud}
            onChange={(e) => actualizar("experiencia_cloud", e.target.value as Perfil["experiencia_cloud"])}
            className={entradaBase(false)}
          >
            <option value="ninguna">Ninguna</option>
            <option value="básica">Básica</option>
            <option value="intermedia">Intermedia</option>
            <option value="avanzada">Avanzada</option>
          </select>
        </Campo>

        <Campo etiqueta="Experiencia en IA" htmlFor="exp-ia">
          <select
            id="exp-ia"
            value={perfil.experiencia_ia}
            onChange={(e) => actualizar("experiencia_ia", e.target.value as Perfil["experiencia_ia"])}
            className={entradaBase(false)}
          >
            <option value="ninguna">Ninguna</option>
            <option value="básica">Básica</option>
            <option value="intermedia">Intermedia</option>
          </select>
        </Campo>
      </div>

      <Campo
        etiqueta="¿Qué quieres lograr?"
        htmlFor="objetivo"
        error={faltaObjetivo ? "Cuéntanos tu objetivo" : erroresCampo?.objetivo?.[0]}
      >
        <textarea
          id="objetivo"
          rows={3}
          value={perfil.objetivo}
          onChange={(e) => actualizar("objetivo", e.target.value)}
          placeholder="Ej. conseguir prácticas profesionales en un equipo de cloud antes de terminar la carrera"
          className={`${entradaBase(faltaObjetivo)} resize-none`}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {OBJETIVOS.map((objetivo) => (
            <button
              key={objetivo}
              type="button"
              onClick={() => actualizar("objetivo", objetivo)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-ink-600 transition hover:border-orange-500 hover:text-orange-600"
            >
              {objetivo}
            </button>
          ))}
        </div>
      </Campo>

      <button
        type="submit"
        disabled={cargando}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-base font-bold text-ink-900 shadow-sm transition hover:bg-orange-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cargando ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900/30 border-t-ink-900" />
            Generando tu ruta…
          </>
        ) : (
          <>Generar mi ruta de estudio</>
        )}
      </button>

      <p className="text-center text-xs text-ink-400">
        Tu perfil se envía a Amazon Bedrock para generar la ruta. No se almacena.
      </p>
    </form>
  );
}

function Campo({
  etiqueta,
  htmlFor,
  error,
  children,
}: {
  etiqueta: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink-700">
        {etiqueta}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function entradaBase(conError: boolean): string {
  return `w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-800 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
    conError
      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
      : "border-slate-300 focus:border-orange-500 focus:ring-orange-100"
  }`;
}

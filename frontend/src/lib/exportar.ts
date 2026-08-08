import type { Perfil, Ruta } from "../types";

const ETIQUETA_TIPO: Record<string, string> = {
  curso: "Curso",
  lab: "Lab",
  evento_builder_group: "Builder Group",
  proyecto: "Proyecto",
  certificacion: "Certificación",
};

/** Convierte la ruta a Markdown para pegarla en Notion, GitHub o un README. */
export function rutaAMarkdown(ruta: Ruta, perfil: Perfil): string {
  const lineas: string[] = [
    `# Ruta de estudio AWS — ${perfil.nombre}`,
    "",
    ruta.perfil_resumen,
    "",
    `- **Duración:** ${ruta.duracion_semanas} semanas`,
    `- **Dedicación:** ${perfil.tiempo_por_semana_horas} h/semana (~${ruta.tiempo_estudio_estimado_horas} h totales)`,
    `- **Certificación objetivo:** ${ruta.siguiente_certificacion_sugerida}`,
    "",
    "---",
    "",
  ];

  for (const semana of ruta.ruta) {
    lineas.push(`## Semana ${semana.semana} · Nivel ${semana.nivel} — ${semana.tema}`);
    if (semana.objetivo_semana) lineas.push("", `_${semana.objetivo_semana}_`);
    lineas.push("");
    for (const recurso of semana.recursos) {
      const etiqueta = ETIQUETA_TIPO[recurso.tipo] ?? recurso.tipo;
      const titulo = recurso.link ? `[${recurso.nombre}](${recurso.link})` : recurso.nombre;
      const horas = recurso.horas_estimadas ? ` — ${recurso.horas_estimadas} h` : "";
      lineas.push(`- **${etiqueta}:** ${titulo}${horas}`);
      if (recurso.descripcion) lineas.push(`  - ${recurso.descripcion}`);
    }
    lineas.push("");
  }

  if (ruta.consejos?.length) {
    lineas.push("---", "", "## Consejos", "");
    ruta.consejos.forEach((consejo) => lineas.push(`- ${consejo}`));
    lineas.push("");
  }

  lineas.push("---", "", "_Generado con AWS Study Path Coach — AWS Student Builder Group UAEMex._");

  return lineas.join("\n");
}

export function descargarArchivo(contenido: string, nombre: string, tipoMime: string): void {
  const blob = new Blob([contenido], { type: `${tipoMime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export function nombreArchivo(perfil: Perfil, extension: string): string {
  const base = perfil.nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `ruta-aws-${base || "estudiante"}.${extension}`;
}

export type NivelAws = 100 | 200 | 300;

export type TipoRecurso =
  | "curso"
  | "lab"
  | "evento_builder_group"
  | "proyecto"
  | "certificacion";

export interface Perfil {
  nombre: string;
  carrera: string;
  semestre: number;
  experiencia_cloud: "ninguna" | "básica" | "intermedia" | "avanzada";
  experiencia_ia: "ninguna" | "básica" | "intermedia";
  objetivo: string;
  tiempo_por_semana_horas: number;
  nivel_actual_aws: NivelAws;
}

export interface Recurso {
  tipo: TipoRecurso;
  nombre: string;
  descripcion?: string;
  link?: string;
  horas_estimadas?: number;
}

export interface Semana {
  semana: number;
  nivel: NivelAws;
  tema: string;
  objetivo_semana?: string;
  recursos: Recurso[];
}

export interface Ruta {
  perfil_resumen: string;
  duracion_semanas: number;
  ruta: Semana[];
  siguiente_certificacion_sugerida: string;
  tiempo_estudio_estimado_horas: number;
  consejos?: string[];
}

export interface MetaRuta {
  modelo: string;
  origen: "bedrock" | "mock";
  tokens_entrada?: number;
  tokens_salida?: number;
  ms: number;
}

export interface RespuestaRuta {
  ruta: Ruta;
  meta: MetaRuta;
}

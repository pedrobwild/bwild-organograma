export type CompetencyLevel = "basico" | "intermediario" | "avancado" | "especialista";

export interface Competency {
  name: string;
  level: CompetencyLevel;
}

export interface KPI {
  label: string;
  target?: string;
  description?: string;
}

export interface JobDescription {
  mission?: string;
  responsibilities?: string[];
  requirements?: string[];
  desired?: string[];
  hardSkills?: string[];
  softSkills?: string[];
  competencies?: Competency[];
  kpis?: KPI[];
  notes?: string;
  updatedAt?: string;
}

export const EMPTY_JD: JobDescription = {
  mission: "",
  responsibilities: [],
  requirements: [],
  desired: [],
  hardSkills: [],
  softSkills: [],
  competencies: [],
  kpis: [],
  notes: "",
};

export const COMPETENCY_LEVEL_LABEL: Record<CompetencyLevel, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
  especialista: "Especialista",
};

export const COMPETENCY_LEVEL_VALUE: Record<CompetencyLevel, number> = {
  basico: 1,
  intermediario: 2,
  avancado: 3,
  especialista: 4,
};

export const SENIORIDADES = [
  "Estagiário",
  "Trainee",
  "Júnior",
  "Pleno",
  "Sênior",
  "Especialista",
  "Coordenador",
  "Gerente",
  "Head",
  "Diretor",
  "C-Level",
] as const;

export type Senioridade = (typeof SENIORIDADES)[number];
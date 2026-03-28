export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  nivel: number;
  foto: string | null;
  funcoes: string[];
  superior: string | null;
  subordinados: string[];
}

export interface OrganogramaData {
  empresa: string;
  colaboradores: Colaborador[];
}

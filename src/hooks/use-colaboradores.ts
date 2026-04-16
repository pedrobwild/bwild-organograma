import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Colaborador } from "@/types/organogram";

interface DbColaborador {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  nivel: number;
  foto_url: string | null;
  funcoes: string[];
  superior_id: string | null;
  status: string;
  tipo_contrato: string | null;
}

function dbToColaborador(db: DbColaborador, allDb: DbColaborador[]): Colaborador {
  const subordinados = allDb
    .filter((c) => c.superior_id === db.id)
    .map((c) => c.id);

  return {
    id: db.id,
    nome: db.nome,
    cargo: db.cargo,
    departamento: db.departamento,
    nivel: db.nivel,
    foto: db.foto_url,
    funcoes: db.funcoes,
    superior: db.superior_id,
    subordinados,
    status: db.status,
    tipo_contrato: db.tipo_contrato,
  };
}

export function useColaboradores() {
  return useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .order("nivel", { ascending: true });

      if (error) throw error;
      const dbRows = data as DbColaborador[];
      return dbRows.map((row) => dbToColaborador(row, dbRows));
    },
  });
}

export function useDepartmentColors() {
  return useQuery({
    queryKey: ["department_colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_colors")
        .select("*");

      if (error) throw error;
      return data as { id: string; departamento: string; bg: string; text_color: string }[];
    },
  });
}

export function useUpdateColaborador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, any> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from("colaboradores")
        .update(rest as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaborador_full"] });
    },
  });
}

export function useCreateColaborador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; nome: string; cargo: string; departamento: string; nivel: number; funcoes: string[]; superior_id: string | null }) => {
      const { error } = await supabase.from("colaboradores").insert(data);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colaboradores"] }),
  });
}

export function useDeleteColaborador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colaboradores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colaboradores"] }),
  });
}

export function useUpdateDepartmentColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; bg: string; text_color?: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from("department_colors")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["department_colors"] }),
  });
}

export function useCreateDepartmentColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { departamento: string; bg: string; text_color?: string }) => {
      const { error } = await supabase.from("department_colors").insert(data);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["department_colors"] }),
  });
}

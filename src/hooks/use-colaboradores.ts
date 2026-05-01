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
  cor_card: string | null;
}

function dbToColaborador(
  db: DbColaborador,
  allDb: DbColaborador[],
  extraLeaders: Map<string, string[]>,
): Colaborador {
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
    cor_card: db.cor_card,
    lideres_extras: extraLeaders.get(db.id) ?? [],
  };
}

export function useColaboradores() {
  return useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const [{ data, error }, { data: lideres, error: lerror }] = await Promise.all([
        supabase.from("colaboradores").select("*").order("nivel", { ascending: true }),
        supabase.from("colaborador_lideres").select("colaborador_id, lider_id"),
      ]);

      if (error) throw error;
      if (lerror) throw lerror;
      const dbRows = data as DbColaborador[];
      const map = new Map<string, string[]>();
      for (const row of (lideres ?? []) as { colaborador_id: string; lider_id: string }[]) {
        const arr = map.get(row.colaborador_id) ?? [];
        arr.push(row.lider_id);
        map.set(row.colaborador_id, arr);
      }
      return dbRows.map((row) => dbToColaborador(row, dbRows, map));
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

const nullableTextFields = new Set([
  "foto_url",
  "superior_id",
  "tipo_contrato",
  "cor_card",
  "motivo_desligamento",
  "carga_horaria",
  "email_corporativo",
  "email_pessoal",
  "telefone",
  "cpf",
  "cnpj",
  "endereco",
  "cidade",
  "estado",
  "cep",
  "banco",
  "agencia",
  "conta",
  "tipo_conta",
  "chave_pix",
  "observacoes",
  "senioridade",
  "missao",
]);

const nullableDateFields = new Set(["data_inicio", "data_desligamento", "data_nascimento"]);
const nullableNumberFields = new Set(["salario_base"]);
const nullableIntegerFields = new Set(["dia_pagamento_1", "dia_pagamento_2"]);

function toNullableString(value: unknown) {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toNullableNumber(value: unknown) {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeColaboradorUpdates(updates: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(updates)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (nullableDateFields.has(key) || nullableTextFields.has(key)) return [key, toNullableString(value)];
        if (nullableNumberFields.has(key)) return [key, toNullableNumber(value)];
        if (nullableIntegerFields.has(key)) {
          const parsed = toNullableNumber(value);
          return [key, parsed == null ? null : Math.trunc(parsed)];
        }
        return [key, value];
      }),
  );
}

export function useUpdateColaborador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, any> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from("colaboradores")
        .update(sanitizeColaboradorUpdates(rest) as any)
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

export function useAddLeader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ colaborador_id, lider_id }: { colaborador_id: string; lider_id: string }) => {
      const { error } = await supabase
        .from("colaborador_lideres")
        .insert({ colaborador_id, lider_id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colaboradores"] }),
  });
}

export function useRemoveLeader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ colaborador_id, lider_id }: { colaborador_id: string; lider_id: string }) => {
      const { error } = await supabase
        .from("colaborador_lideres")
        .delete()
        .eq("colaborador_id", colaborador_id)
        .eq("lider_id", lider_id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colaboradores"] }),
  });
}

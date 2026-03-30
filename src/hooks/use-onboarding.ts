import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingItem {
  id: string;
  colaborador_id: string;
  label: string;
  concluido: boolean;
  data_conclusao: string | null;
  data_limite: string | null;
  notas: string | null;
  ordem: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export function useOnboardingChecklist(colaboradorId: string | null) {
  return useQuery({
    queryKey: ["onboarding", colaboradorId],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_checklist")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as OnboardingItem[];
    },
  });
}

export function useUpdateOnboardingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      colaboradorId: string;
      concluido?: boolean;
      data_conclusao?: string | null;
      notas?: string | null;
    }) => {
      const { id, colaboradorId, ...updates } = params;
      const { error } = await supabase
        .from("onboarding_checklist")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return colaboradorId;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["onboarding", v.colaboradorId] });
      qc.invalidateQueries({ queryKey: ["onboarding_summary"] });
    },
  });
}

export function useCreateOnboardingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: {
      colaborador_id: string;
      label: string;
      ordem: number;
      is_custom: boolean;
    }) => {
      const { error } = await supabase.from("onboarding_checklist").insert(row);
      if (error) throw error;
      return row.colaborador_id;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["onboarding", v.colaborador_id] });
      qc.invalidateQueries({ queryKey: ["onboarding_summary"] });
    },
  });
}

export function useDeleteOnboardingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, colaboradorId }: { id: string; colaboradorId: string }) => {
      const { error } = await supabase.from("onboarding_checklist").delete().eq("id", id);
      if (error) throw error;
      return colaboradorId;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["onboarding", v.colaboradorId] });
      qc.invalidateQueries({ queryKey: ["onboarding_summary"] });
    },
  });
}

// Summary for dashboard — all onboarding items for recent hires
export function useOnboardingSummary() {
  return useQuery({
    queryKey: ["onboarding_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_checklist")
        .select("colaborador_id, concluido");
      if (error) throw error;

      // Group by colaborador
      const byColab: Record<string, { total: number; done: number }> = {};
      for (const row of data) {
        if (!byColab[row.colaborador_id]) {
          byColab[row.colaborador_id] = { total: 0, done: 0 };
        }
        byColab[row.colaborador_id].total++;
        if (row.concluido) byColab[row.colaborador_id].done++;
      }
      return byColab;
    },
  });
}

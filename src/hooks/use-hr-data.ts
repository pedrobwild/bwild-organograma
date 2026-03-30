import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Benefícios ───
export function useBeneficios(colaboradorId: string | null) {
  return useQuery({
    queryKey: ["beneficios", colaboradorId],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beneficios_colaborador")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertBeneficio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { id?: string; colaborador_id: string; tipo: string; valor?: number | null; descricao?: string | null; ativo?: boolean }) => {
      if (row.id) {
        const { id, ...rest } = row;
        const { error } = await supabase.from("beneficios_colaborador").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("beneficios_colaborador").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["beneficios", v.colaborador_id] }),
  });
}

export function useDeleteBeneficio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, colaboradorId }: { id: string; colaboradorId: string }) => {
      const { error } = await supabase.from("beneficios_colaborador").delete().eq("id", id);
      if (error) throw error;
      return colaboradorId;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["beneficios", v.colaboradorId] }),
  });
}

// ─── Comissões ───
export function useComissoes(colaboradorId: string | null) {
  return useQuery({
    queryKey: ["comissoes", colaboradorId],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("politicas_comissao")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertComissao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { id?: string; colaborador_id: string; descricao: string; percentual?: number | null; base_calculo?: string | null; meta_mensal?: number | null; observacoes?: string | null; ativo?: boolean }) => {
      if (row.id) {
        const { id, ...rest } = row;
        const { error } = await supabase.from("politicas_comissao").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("politicas_comissao").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["comissoes", v.colaborador_id] }),
  });
}

// ─── Veículos ───
export function useVeiculos(colaboradorId: string | null) {
  return useQuery({
    queryKey: ["veiculos", colaboradorId],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("politicas_veiculo")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertVeiculo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { id?: string; colaborador_id: string; tem_direito?: boolean; tipo?: string | null; valor_km?: number | null; teto_mensal?: number | null; placa_veiculo?: string | null; modelo_veiculo?: string | null; observacoes?: string | null; ativo?: boolean }) => {
      if (row.id) {
        const { id, ...rest } = row;
        const { error } = await supabase.from("politicas_veiculo").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("politicas_veiculo").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["veiculos", v.colaborador_id] }),
  });
}

// ─── Documentos ───
export function useDocumentos(colaboradorId: string | null) {
  return useQuery({
    queryKey: ["documentos", colaboradorId],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_colaborador")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUploadDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      colaboradorId: string;
      file: File;
      tipo: string;
      descricao?: string;
      dataDocumento?: string;
      userId?: string;
    }) => {
      const uuid = crypto.randomUUID();
      const storagePath = `${params.colaboradorId}/${uuid}-${params.file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from("documentos")
        .upload(storagePath, params.file);
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase.from("documentos_colaborador").insert({
        colaborador_id: params.colaboradorId,
        tipo: params.tipo,
        nome_arquivo: params.file.name,
        storage_path: storagePath,
        tamanho_bytes: params.file.size,
        mime_type: params.file.type,
        descricao: params.descricao || null,
        data_documento: params.dataDocumento || null,
        uploaded_by: params.userId || null,
      });
      if (dbErr) throw dbErr;
      return params.colaboradorId;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["documentos", v.colaboradorId] }),
  });
}

export function useDeleteDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath, colaboradorId }: { id: string; storagePath: string; colaboradorId: string }) => {
      await supabase.storage.from("documentos").remove([storagePath]);
      const { error } = await supabase.from("documentos_colaborador").delete().eq("id", id);
      if (error) throw error;
      return colaboradorId;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["documentos", v.colaboradorId] }),
  });
}

// ─── Histórico de Cargos ───
export function useHistoricoCargos(colaboradorId: string | null) {
  return useQuery({
    queryKey: ["historico_cargos", colaboradorId],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_cargos")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .order("data_mudanca", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateHistorico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: {
      colaborador_id: string;
      cargo_anterior?: string | null;
      cargo_novo: string;
      salario_anterior?: number | null;
      salario_novo?: number | null;
      data_mudanca: string;
      motivo?: string | null;
    }) => {
      const { error } = await supabase.from("historico_cargos").insert(row);
      if (error) throw error;
      return row.colaborador_id;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["historico_cargos", v.colaborador_id] });
      qc.invalidateQueries({ queryKey: ["dashboard_historico"] });
    },
  });
}

// ─── Full colaborador row (with new HR columns) ───
export function useColaboradorFull(colaboradorId: string | null) {
  return useQuery({
    queryKey: ["colaborador_full", colaboradorId],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .eq("id", colaboradorId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

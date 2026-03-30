import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardData() {
  const colaboradores = useQuery({
    queryKey: ["dashboard_colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nome, cargo, departamento, nivel, foto_url, status, tipo_contrato, data_inicio, data_nascimento, salario_base, funcoes, superior_id")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const historico = useQuery({
    queryKey: ["dashboard_historico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_cargos")
        .select("*")
        .order("data_mudanca", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const documentos = useQuery({
    queryKey: ["dashboard_documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_colaborador")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const deptColors = useQuery({
    queryKey: ["department_colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_colors")
        .select("*");
      if (error) throw error;
      return data as { departamento: string; bg: string; text_color: string }[];
    },
  });

  return {
    colaboradores: colaboradores.data ?? [],
    historico: historico.data ?? [],
    documentos: documentos.data ?? [],
    deptColors: deptColors.data ?? [],
    isLoading: colaboradores.isLoading || historico.isLoading || documentos.isLoading,
  };
}

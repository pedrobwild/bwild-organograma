export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      beneficios_colaborador: {
        Row: {
          ativo: boolean | null
          colaborador_id: string
          created_at: string | null
          descricao: string | null
          id: string
          tipo: string
          valor: number | null
        }
        Insert: {
          ativo?: boolean | null
          colaborador_id: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo: string
          valor?: number | null
        }
        Update: {
          ativo?: boolean | null
          colaborador_id?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficios_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          agencia: string | null
          banco: string | null
          carga_horaria: string | null
          cargo: string
          cep: string | null
          chave_pix: string | null
          cidade: string | null
          conta: string | null
          cor_card: string | null
          cpf: string | null
          created_at: string
          data_desligamento: string | null
          data_inicio: string | null
          data_nascimento: string | null
          departamento: string
          email_corporativo: string | null
          email_pessoal: string | null
          endereco: string | null
          estado: string | null
          foto_url: string | null
          funcoes: string[]
          id: string
          job_description: Json
          missao: string | null
          motivo_desligamento: string | null
          nivel: number
          nome: string
          observacoes: string | null
          salario_base: number | null
          senioridade: string | null
          status: string
          superior_id: string | null
          telefone: string | null
          tipo_conta: string | null
          tipo_contrato: string | null
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          carga_horaria?: string | null
          cargo: string
          cep?: string | null
          chave_pix?: string | null
          cidade?: string | null
          conta?: string | null
          cor_card?: string | null
          cpf?: string | null
          created_at?: string
          data_desligamento?: string | null
          data_inicio?: string | null
          data_nascimento?: string | null
          departamento: string
          email_corporativo?: string | null
          email_pessoal?: string | null
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          funcoes?: string[]
          id: string
          job_description?: Json
          missao?: string | null
          motivo_desligamento?: string | null
          nivel?: number
          nome: string
          observacoes?: string | null
          salario_base?: number | null
          senioridade?: string | null
          status?: string
          superior_id?: string | null
          telefone?: string | null
          tipo_conta?: string | null
          tipo_contrato?: string | null
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          carga_horaria?: string | null
          cargo?: string
          cep?: string | null
          chave_pix?: string | null
          cidade?: string | null
          conta?: string | null
          cor_card?: string | null
          cpf?: string | null
          created_at?: string
          data_desligamento?: string | null
          data_inicio?: string | null
          data_nascimento?: string | null
          departamento?: string
          email_corporativo?: string | null
          email_pessoal?: string | null
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          funcoes?: string[]
          id?: string
          job_description?: Json
          missao?: string | null
          motivo_desligamento?: string | null
          nivel?: number
          nome?: string
          observacoes?: string | null
          salario_base?: number | null
          senioridade?: string | null
          status?: string
          superior_id?: string | null
          telefone?: string | null
          tipo_conta?: string | null
          tipo_contrato?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_superior_id_fkey"
            columns: ["superior_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      department_colors: {
        Row: {
          bg: string
          created_at: string
          departamento: string
          id: string
          text_color: string
          updated_at: string
        }
        Insert: {
          bg: string
          created_at?: string
          departamento: string
          id?: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          bg?: string
          created_at?: string
          departamento?: string
          id?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      documentos_colaborador: {
        Row: {
          colaborador_id: string
          created_at: string | null
          data_documento: string | null
          descricao: string | null
          id: string
          mime_type: string | null
          nome_arquivo: string
          storage_path: string
          tamanho_bytes: number | null
          tipo: string
          uploaded_by: string | null
        }
        Insert: {
          colaborador_id: string
          created_at?: string | null
          data_documento?: string | null
          descricao?: string | null
          id?: string
          mime_type?: string | null
          nome_arquivo: string
          storage_path: string
          tamanho_bytes?: number | null
          tipo: string
          uploaded_by?: string | null
        }
        Update: {
          colaborador_id?: string
          created_at?: string | null
          data_documento?: string | null
          descricao?: string | null
          id?: string
          mime_type?: string | null
          nome_arquivo?: string
          storage_path?: string
          tamanho_bytes?: number | null
          tipo?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_colaborador_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_cargos: {
        Row: {
          aprovado_por: string | null
          cargo_anterior: string | null
          cargo_novo: string
          colaborador_id: string
          created_at: string | null
          data_mudanca: string
          id: string
          motivo: string | null
          salario_anterior: number | null
          salario_novo: number | null
        }
        Insert: {
          aprovado_por?: string | null
          cargo_anterior?: string | null
          cargo_novo: string
          colaborador_id: string
          created_at?: string | null
          data_mudanca: string
          id?: string
          motivo?: string | null
          salario_anterior?: number | null
          salario_novo?: number | null
        }
        Update: {
          aprovado_por?: string | null
          cargo_anterior?: string | null
          cargo_novo?: string
          colaborador_id?: string
          created_at?: string | null
          data_mudanca?: string
          id?: string
          motivo?: string | null
          salario_anterior?: number | null
          salario_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_cargos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklist: {
        Row: {
          colaborador_id: string
          concluido: boolean
          created_at: string
          data_conclusao: string | null
          data_limite: string | null
          id: string
          is_custom: boolean
          label: string
          notas: string | null
          ordem: number
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          data_limite?: string | null
          id?: string
          is_custom?: boolean
          label: string
          notas?: string | null
          ordem?: number
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          concluido?: boolean
          created_at?: string
          data_conclusao?: string | null
          data_limite?: string | null
          id?: string
          is_custom?: boolean
          label?: string
          notas?: string | null
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklist_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      politicas_comissao: {
        Row: {
          ativo: boolean | null
          base_calculo: string | null
          colaborador_id: string
          created_at: string | null
          descricao: string
          id: string
          meta_mensal: number | null
          observacoes: string | null
          percentual: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          base_calculo?: string | null
          colaborador_id: string
          created_at?: string | null
          descricao: string
          id?: string
          meta_mensal?: number | null
          observacoes?: string | null
          percentual?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          base_calculo?: string | null
          colaborador_id?: string
          created_at?: string | null
          descricao?: string
          id?: string
          meta_mensal?: number | null
          observacoes?: string | null
          percentual?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "politicas_comissao_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      politicas_veiculo: {
        Row: {
          ativo: boolean | null
          colaborador_id: string
          created_at: string | null
          id: string
          modelo_veiculo: string | null
          observacoes: string | null
          placa_veiculo: string | null
          tem_direito: boolean | null
          teto_mensal: number | null
          tipo: string | null
          valor_km: number | null
        }
        Insert: {
          ativo?: boolean | null
          colaborador_id: string
          created_at?: string | null
          id?: string
          modelo_veiculo?: string | null
          observacoes?: string | null
          placa_veiculo?: string | null
          tem_direito?: boolean | null
          teto_mensal?: number | null
          tipo?: string | null
          valor_km?: number | null
        }
        Update: {
          ativo?: boolean | null
          colaborador_id?: string
          created_at?: string | null
          id?: string
          modelo_veiculo?: string | null
          observacoes?: string | null
          placa_veiculo?: string | null
          tem_direito?: boolean | null
          teto_mensal?: number | null
          tipo?: string | null
          valor_km?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "politicas_veiculo_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

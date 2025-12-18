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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      avaliacoes_mensais: {
        Row: {
          atualizado_em: string
          avaliador_id: string
          criado_em: string
          faixa1_ausencias: number
          faixa1_pendencias: number
          faixa2_chave_atitudes: number
          faixa2_chave_comportamento: number
          faixa2_chave_habilidades: number
          faixa2_chave_valores: number
          faixa2_produtividade: number
          faixa2_qualidade: number
          faixa3_backlog: number
          faixa3_nps_projeto: number
          faixa3_prioridades: number
          faixa3_sla: number
          faixa4_churn: number
          faixa4_nps_global: number
          faixa4_uso_ava: number
          id: string
          mes: string
          prestador_id: string
        }
        Insert: {
          atualizado_em?: string
          avaliador_id: string
          criado_em?: string
          faixa1_ausencias?: number
          faixa1_pendencias?: number
          faixa2_chave_atitudes?: number
          faixa2_chave_comportamento?: number
          faixa2_chave_habilidades?: number
          faixa2_chave_valores?: number
          faixa2_produtividade?: number
          faixa2_qualidade?: number
          faixa3_backlog?: number
          faixa3_nps_projeto?: number
          faixa3_prioridades?: number
          faixa3_sla?: number
          faixa4_churn?: number
          faixa4_nps_global?: number
          faixa4_uso_ava?: number
          id?: string
          mes: string
          prestador_id: string
        }
        Update: {
          atualizado_em?: string
          avaliador_id?: string
          criado_em?: string
          faixa1_ausencias?: number
          faixa1_pendencias?: number
          faixa2_chave_atitudes?: number
          faixa2_chave_comportamento?: number
          faixa2_chave_habilidades?: number
          faixa2_chave_valores?: number
          faixa2_produtividade?: number
          faixa2_qualidade?: number
          faixa3_backlog?: number
          faixa3_nps_projeto?: number
          faixa3_prioridades?: number
          faixa3_sla?: number
          faixa4_churn?: number
          faixa4_nps_global?: number
          faixa4_uso_ava?: number
          id?: string
          mes?: string
          prestador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_mensais_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_mensais_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      prestadores: {
        Row: {
          atualizado_em: string
          avaliador_id: string | null
          criado_em: string
          data_inicio_prestacao: string | null
          email: string
          id: string
          nome: string
          responsavel_ghas: boolean
          salario_fixo: number
          situacao: Database["public"]["Enums"]["situacao_type"]
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          avaliador_id?: string | null
          criado_em?: string
          data_inicio_prestacao?: string | null
          email: string
          id?: string
          nome: string
          responsavel_ghas?: boolean
          salario_fixo?: number
          situacao?: Database["public"]["Enums"]["situacao_type"]
          user_id: string
        }
        Update: {
          atualizado_em?: string
          avaliador_id?: string | null
          criado_em?: string
          data_inicio_prestacao?: string | null
          email?: string
          id?: string
          nome?: string
          responsavel_ghas?: boolean
          salario_fixo?: number
          situacao?: Database["public"]["Enums"]["situacao_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestadores_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_globais: {
        Row: {
          atualizado_em: string
          criado_em: string
          faixa4_churn: number
          faixa4_nps_global: number
          faixa4_uso_ava: number
          id: string
          mes: string
          registrado_por_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          faixa4_churn?: number
          faixa4_nps_global?: number
          faixa4_uso_ava?: number
          id?: string
          mes: string
          registrado_por_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          faixa4_churn?: number
          faixa4_nps_global?: number
          faixa4_uso_ava?: number
          id?: string
          mes?: string
          registrado_por_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_globais_registrado_por_id_fkey"
            columns: ["registrado_por_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
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
      current_prestador_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "avaliador" | "prestador"
      situacao_type: "ativo" | "inativo"
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
      app_role: ["admin", "avaliador", "prestador"],
      situacao_type: ["ativo", "inativo"],
    },
  },
} as const

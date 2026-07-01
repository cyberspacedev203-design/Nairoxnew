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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      claims: {
        Row: {
          amount: number | null
          claimed_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          claimed_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          claimed_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_activations: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          receipt_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          withdrawal_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          withdrawal_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gateway_activations_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      instant_activation_payments: {
        Row: {
          amount: number
          created_at: string
          has_receipt: boolean | null
          id: string
          receipt_count: number | null
          receipt_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          has_receipt?: boolean | null
          id?: string
          receipt_count?: number | null
          receipt_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          has_receipt?: boolean | null
          id?: string
          receipt_count?: number | null
          receipt_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activation_paid: boolean | null
          balance: number | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          instant_activation_paid: boolean | null
          referral_code: string
          referral_earnings: number | null
          referred_by: string | null
          standard_activation_unlocked: boolean | null
          task_progress: number | null
          task_completed: boolean | null
          total_referrals: number | null
          updated_at: string | null
          withdrawal_count: number | null
        }
        Insert: {
          activation_paid?: boolean | null
          balance?: number | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          instant_activation_paid?: boolean | null
          referral_code: string
          referral_earnings?: number | null
          referred_by?: string | null
          standard_activation_unlocked?: boolean | null
          task_progress?: number | null
          task_completed?: boolean | null
          total_referrals?: number | null
          updated_at?: string | null
          withdrawal_count?: number | null
        }
        Update: {
          activation_paid?: boolean | null
          balance?: number | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          instant_activation_paid?: boolean | null
          referral_code?: string
          referral_earnings?: number | null
          referred_by?: string | null
          standard_activation_unlocked?: boolean | null
          task_progress?: number | null
          task_completed?: boolean | null
          total_referrals?: number | null
          updated_at?: string | null
          withdrawal_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spins: {
        Row: {
          created_at: string | null
          id: string
          prize: number
          result: string
          stake: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prize?: number
          result: string
          stake: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prize?: number
          result?: string
          stake?: number
          user_id?: string
        }
        Relationships: []
      }
      topup_receipts: {
        Row: {
          created_at: string | null
          file_size: number
          id: string
          mime_type: string
          storage_key: string
          topup_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_size: number
          id?: string
          mime_type: string
          storage_key: string
          topup_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_size?: number
          id?: string
          mime_type?: string
          storage_key?: string
          topup_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "topup_receipts_topup_id_fkey"
            columns: ["topup_id"]
            isOneToOne: false
            referencedRelation: "instant_activation_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrades: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          price: number
          receipt_url: string | null
          status: string | null
          upgrade_level: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          price: number
          receipt_url?: string | null
          status?: string | null
          upgrade_level: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          price?: number
          receipt_url?: string | null
          status?: string | null
          upgrade_level?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upgrades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_activation_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          receipt_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_name: string
          account_number: string
          activation_payment_amount: number | null
          activation_receipt_url: string | null
          activation_reviewed_at: string | null
          activation_reviewed_by: string | null
          activation_submitted_at: string | null
          amount: number
          bank_name: string
          created_at: string | null
          id: string
          rejection_reason: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          activation_payment_amount?: number | null
          activation_receipt_url?: string | null
          activation_reviewed_at?: string | null
          activation_reviewed_by?: string | null
          activation_submitted_at?: string | null
          amount: number
          bank_name: string
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          activation_payment_amount?: number | null
          activation_receipt_url?: string | null
          activation_reviewed_at?: string | null
          activation_reviewed_by?: string | null
          activation_submitted_at?: string | null
          amount?: number
          bank_name?: string
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

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
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      card_applications: {
        Row: {
          applied_date: string | null
          card_id: string
          created_at: string
          docs_checklist: Json | null
          id: string
          issuer_link: string | null
          notes: string | null
          status: string
          status_updated_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_date?: string | null
          card_id: string
          created_at?: string
          docs_checklist?: Json | null
          id?: string
          issuer_link?: string | null
          notes?: string | null
          status?: string
          status_updated_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_date?: string | null
          card_id?: string
          created_at?: string
          docs_checklist?: Json | null
          id?: string
          issuer_link?: string | null
          notes?: string | null
          status?: string
          status_updated_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          display_order: number
          icon_position: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          icon_position?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          icon_position?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_feed: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_evergreen: boolean | null
          tag: string | null
          target_categories: string[] | null
          target_income_bands: string[] | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_evergreen?: boolean | null
          tag?: string | null
          target_categories?: string[] | null
          target_income_bands?: string[] | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_evergreen?: boolean | null
          tag?: string | null
          target_categories?: string[] | null
          target_income_bands?: string[] | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          annual_fee: number
          card_id: string
          category_badges: string[]
          created_at: string | null
          docs_required: string | null
          downsides: string[]
          eligibility: string | null
          forex_markup: string
          forex_markup_pct: number
          id: string
          ideal_for: string[]
          image_url: string | null
          is_active: boolean | null
          issuer: string
          key_perks: string[]
          lounge_access: string
          name: string
          network: string
          popular_score: number
          reward_structure: string
          reward_type: string[]
          tnc_url: string | null
          updated_at: string | null
          waiver_rule: string | null
          welcome_bonus: string
        }
        Insert: {
          annual_fee: number
          card_id: string
          category_badges: string[]
          created_at?: string | null
          docs_required?: string | null
          downsides: string[]
          eligibility?: string | null
          forex_markup: string
          forex_markup_pct: number
          id?: string
          ideal_for: string[]
          image_url?: string | null
          is_active?: boolean | null
          issuer: string
          key_perks: string[]
          lounge_access: string
          name: string
          network: string
          popular_score: number
          reward_structure: string
          reward_type: string[]
          tnc_url?: string | null
          updated_at?: string | null
          waiver_rule?: string | null
          welcome_bonus: string
        }
        Update: {
          annual_fee?: number
          card_id?: string
          category_badges?: string[]
          created_at?: string | null
          docs_required?: string | null
          downsides?: string[]
          eligibility?: string | null
          forex_markup?: string
          forex_markup_pct?: number
          id?: string
          ideal_for?: string[]
          image_url?: string | null
          is_active?: boolean | null
          issuer?: string
          key_perks?: string[]
          lounge_access?: string
          name?: string
          network?: string
          popular_score?: number
          reward_structure?: string
          reward_type?: string[]
          tnc_url?: string | null
          updated_at?: string | null
          waiver_rule?: string | null
          welcome_bonus?: string
        }
        Relationships: []
      }
      fee_waiver_goals: {
        Row: {
          card_id: string
          created_at: string
          current_amount: number | null
          id: string
          target_amount: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          card_id: string
          created_at?: string
          current_amount?: number | null
          id?: string
          target_amount: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          card_id?: string
          created_at?: string
          current_amount?: number | null
          id?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          created_at: string | null
          expires_at: string
          failed_attempts: number | null
          id: string
          locked_until: string | null
          otp_code: string
          phone_e164: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          otp_code: string
          phone_e164: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          otp_code?: string
          phone_e164?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          income_band_inr: string | null
          marketing_consent: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone_e164: string | null
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          income_band_inr?: string | null
          marketing_consent?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone_e164?: string | null
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          income_band_inr?: string | null
          marketing_consent?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone_e164?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recommendation_snapshots: {
        Row: {
          analysis_id: string | null
          confidence: string
          created_at: string
          id: string
          recommended_cards: Json
          savings_max: number
          savings_min: number
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          confidence: string
          created_at?: string
          id?: string
          recommended_cards?: Json
          savings_max: number
          savings_min: number
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          confidence?: string
          created_at?: string
          id?: string
          recommended_cards?: Json
          savings_max?: number
          savings_min?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_snapshots_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "spending_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          section: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          section: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          section?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      spending_analyses: {
        Row: {
          analysis_data: Json
          created_at: string
          id: string
          statement_paths: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string
          id?: string
          statement_paths: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          id?: string
          statement_paths?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spending_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cards: {
        Row: {
          card_id: string
          created_at: string
          forex_pct: number | null
          id: string
          is_active: boolean | null
          lounge_quota_total: number | null
          lounge_used: number | null
          opened_month: string | null
          renewal_month: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          forex_pct?: number | null
          id?: string
          is_active?: boolean | null
          lounge_quota_total?: number | null
          lounge_used?: number | null
          opened_month?: string | null
          renewal_month?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          forex_pct?: number | null
          id?: string
          is_active?: boolean | null
          lounge_quota_total?: number | null
          lounge_used?: number | null
          opened_month?: string | null
          renewal_month?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          email_marketing: boolean | null
          email_reminders: boolean | null
          fee_sensitivity: string | null
          id: string
          lounge_importance: string | null
          preference_type: string | null
          travel_frequency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_marketing?: boolean | null
          email_reminders?: boolean | null
          fee_sensitivity?: string | null
          id?: string
          lounge_importance?: string | null
          preference_type?: string | null
          travel_frequency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_marketing?: boolean | null
          email_reminders?: boolean | null
          fee_sensitivity?: string | null
          id?: string
          lounge_importance?: string | null
          preference_type?: string | null
          travel_frequency?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reminders: {
        Row: {
          card_id: string | null
          created_at: string
          description: string | null
          dismissed: boolean | null
          id: string
          reminder_date: string
          reminder_type: string
          title: string
          user_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          id?: string
          reminder_date: string
          reminder_type: string
          title: string
          user_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string
          description?: string | null
          dismissed?: boolean | null
          id?: string
          reminder_date?: string
          reminder_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_shortlist: {
        Row: {
          added_at: string
          card_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          card_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          card_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_phone_verifications: { Args: never; Returns: number }
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

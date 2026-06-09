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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      exercise_performance: {
        Row: {
          best_set_json: Json | null
          e1rm: number | null
          exercise_id: string
          user_id: string
          week_start: string
          weekly_sets: number
          weekly_volume: number
        }
        Insert: {
          best_set_json?: Json | null
          e1rm?: number | null
          exercise_id: string
          user_id: string
          week_start: string
          weekly_sets?: number
          weekly_volume?: number
        }
        Update: {
          best_set_json?: Json | null
          e1rm?: number | null
          exercise_id?: string
          user_id?: string
          week_start?: string
          weekly_sets?: number
          weekly_volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_performance_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_templates: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_compound: boolean
          movement_type: Database["public"]["Enums"]["movement_type"]
          muscle_groups: string[]
          name: string
          other_muscles: string[]
          primary_muscle: string
          secondary_muscles: string[]
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_compound?: boolean
          movement_type: Database["public"]["Enums"]["movement_type"]
          muscle_groups?: string[]
          name: string
          other_muscles?: string[]
          primary_muscle: string
          secondary_muscles?: string[]
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_compound?: boolean
          movement_type?: Database["public"]["Enums"]["movement_type"]
          muscle_groups?: string[]
          name?: string
          other_muscles?: string[]
          primary_muscle?: string
          secondary_muscles?: string[]
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string
          e1rm_formula: string | null
          id: string
          is_compound: boolean
          is_tracked: boolean
          movement_type: Database["public"]["Enums"]["movement_type"]
          muscle_groups: string[]
          name: string
          other_muscles: string[]
          primary_muscle: string
          secondary_muscles: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          e1rm_formula?: string | null
          id?: string
          is_compound?: boolean
          is_tracked?: boolean
          movement_type: Database["public"]["Enums"]["movement_type"]
          muscle_groups?: string[]
          name: string
          other_muscles?: string[]
          primary_muscle: string
          secondary_muscles?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          e1rm_formula?: string | null
          id?: string
          is_compound?: boolean
          is_tracked?: boolean
          movement_type?: Database["public"]["Enums"]["movement_type"]
          muscle_groups?: string[]
          name?: string
          other_muscles?: string[]
          primary_muscle?: string
          secondary_muscles?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fatigue_signals: {
        Row: {
          calculated_at: string
          consecutive_high_rpe_sessions: number
          deload_reason: string | null
          deload_score: number
          deload_tier: Database["public"]["Enums"]["deload_tier"] | null
          dropped_exercises: string[]
          performance_drop_detected: boolean
          rolling_7d_avg_rpe: number | null
          rpe_trend: number | null
          stalled_exercises: string[]
          user_id: string
        }
        Insert: {
          calculated_at?: string
          consecutive_high_rpe_sessions?: number
          deload_reason?: string | null
          deload_score?: number
          deload_tier?: Database["public"]["Enums"]["deload_tier"] | null
          dropped_exercises?: string[]
          performance_drop_detected?: boolean
          rolling_7d_avg_rpe?: number | null
          rpe_trend?: number | null
          stalled_exercises?: string[]
          user_id: string
        }
        Update: {
          calculated_at?: string
          consecutive_high_rpe_sessions?: number
          deload_reason?: string | null
          deload_score?: number
          deload_tier?: Database["public"]["Enums"]["deload_tier"] | null
          dropped_exercises?: string[]
          performance_drop_detected?: boolean
          rolling_7d_avg_rpe?: number | null
          rpe_trend?: number | null
          stalled_exercises?: string[]
          user_id?: string
        }
        Relationships: []
      }
      muscle_weekly_volume: {
        Row: {
          avg_rpe: number | null
          muscle: string
          sets: number
          user_id: string
          week_start: string
          weighted_tonnage_kg: number
        }
        Insert: {
          avg_rpe?: number | null
          muscle: string
          sets?: number
          user_id: string
          week_start: string
          weighted_tonnage_kg?: number
        }
        Update: {
          avg_rpe?: number | null
          muscle?: string
          sets?: number
          user_id?: string
          week_start?: string
          weighted_tonnage_kg?: number
        }
        Relationships: []
      }
      program_exercises: {
        Row: {
          exercise_id: string
          program_id: string
          sort_order: number
        }
        Insert: {
          exercise_id: string
          program_id: string
          sort_order: number
        }
        Update: {
          exercise_id?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_exercises_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recovery_metrics: {
        Row: {
          body_weight_kg: number | null
          date: string
          hrv: number | null
          resting_hr: number | null
          sleep_hours: number | null
          user_id: string
        }
        Insert: {
          body_weight_kg?: number | null
          date: string
          hrv?: number | null
          resting_hr?: number | null
          sleep_hours?: number | null
          user_id: string
        }
        Update: {
          body_weight_kg?: number | null
          date?: string
          hrv?: number | null
          resting_hr?: number | null
          sleep_hours?: number | null
          user_id?: string
        }
        Relationships: []
      }
      sets: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          reps: number
          rpe: number | null
          set_number: number
          set_type: Database["public"]["Enums"]["set_type"]
          weight_kg: number
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          reps: number
          rpe?: number | null
          set_number: number
          set_type?: Database["public"]["Enums"]["set_type"]
          weight_kg: number
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: number
          rpe?: number | null
          set_number?: number
          set_type?: Database["public"]["Enums"]["set_type"]
          weight_kg?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      training_blocks: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          name: string
          notes: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users_settings: {
        Row: {
          chart_weeks: number
          created_at: string
          display_unit: Database["public"]["Enums"]["display_unit"]
          rest_timer_enabled: boolean
          rest_timer_seconds: number
          updated_at: string
          user_id: string
          week_start_day: number
        }
        Insert: {
          chart_weeks?: number
          created_at?: string
          display_unit?: Database["public"]["Enums"]["display_unit"]
          rest_timer_enabled?: boolean
          rest_timer_seconds?: number
          updated_at?: string
          user_id: string
          week_start_day?: number
        }
        Update: {
          chart_weeks?: number
          created_at?: string
          display_unit?: Database["public"]["Enums"]["display_unit"]
          rest_timer_enabled?: boolean
          rest_timer_seconds?: number
          updated_at?: string
          user_id?: string
          week_start_day?: number
        }
        Relationships: []
      }
      weekly_volume: {
        Row: {
          avg_rpe: number | null
          compound_volume: number
          tonnage: number
          total_sets: number
          user_id: string
          week_start: string
          workouts_completed: number
        }
        Insert: {
          avg_rpe?: number | null
          compound_volume?: number
          tonnage?: number
          total_sets?: number
          user_id: string
          week_start: string
          workouts_completed?: number
        }
        Update: {
          avg_rpe?: number | null
          compound_volume?: number
          tonnage?: number
          total_sets?: number
          user_id?: string
          week_start?: string
          workouts_completed?: number
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          date: string
          duration_minutes: number | null
          id: string
          notes: string | null
          program_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          program_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          program_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_muscle_attribution_from_groups: {
        Args: { groups: string[] }
        Returns: {
          other_muscles: string[]
          primary_muscle: string
          secondary_muscles: string[]
        }[]
      }
      calc_e1rm_simple: {
        Args: { p_reps: number; p_weight_kg: number }
        Returns: number
      }
      compare_training_blocks: {
        Args: { p_block_a: string; p_block_b: string }
        Returns: Json
      }
      end_training_block: { Args: { p_block_id: string }; Returns: undefined }
      get_block_summary: { Args: { p_block_id: string }; Returns: Json }
      get_dashboard_muscle_heatmap: {
        Args: { p_week_start_day?: number }
        Returns: Json
      }
      get_dashboard_summary: {
        Args: { p_week_start_day?: number }
        Returns: Json
      }
      get_fatigue_summary: { Args: never; Returns: Json }
      get_muscle_volume_history: {
        Args: { p_muscle: string; p_weeks?: number }
        Returns: Json
      }
      get_muscle_week_stats: {
        Args: { p_muscle: string; p_week_start_day?: number }
        Returns: Json
      }
      get_training_blocks: { Args: never; Returns: Json }
      get_weekly_summary_nlg: {
        Args: { p_week_start_day?: number }
        Returns: Json
      }
      is_valid_grow_muscle: { Args: { m: string }; Returns: boolean }
      list_workouts: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          date: string
          duration_minutes: number
          exercise_count: number
          id: string
          notes: string
          program_id: string
          updated_at: string
          user_id: string
        }[]
      }
      refresh_analytics_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      start_training_block: {
        Args: { p_name: string; p_notes?: string; p_start_date?: string }
        Returns: string
      }
      week_start_for: {
        Args: { p_date: string; p_week_start_day: number }
        Returns: string
      }
    }
    Enums: {
      deload_tier: "lean" | "moderate" | "strong"
      display_unit: "kg" | "lbs"
      movement_type:
        | "upper_push"
        | "upper_pull"
        | "lower_compound"
        | "lower_hinge"
        | "isolation"
      set_type: "working" | "warmup"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      deload_tier: ["lean", "moderate", "strong"],
      display_unit: ["kg", "lbs"],
      movement_type: [
        "upper_push",
        "upper_pull",
        "lower_compound",
        "lower_hinge",
        "isolation",
      ],
      set_type: ["working", "warmup"],
    },
  },
} as const

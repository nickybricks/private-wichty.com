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
      events: {
        Row: {
          attendance_count: number | null
          capacity_unlimited: boolean | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          event_date: string | null
          event_time: string | null
          id: string
          image_url: string | null
          is_paid: boolean | null
          is_public: boolean | null
          location: string | null
          name: string
          price_cents: number | null
          reminder_sent_at: string | null
          requires_approval: boolean | null
          status: Database["public"]["Enums"]["event_status"]
          tags: string[] | null
          target_participants: number
          updated_at: string
          user_id: string
          view_count: number | null
          waitlist_enabled: boolean | null
        }
        Insert: {
          attendance_count?: number | null
          capacity_unlimited?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_paid?: boolean | null
          is_public?: boolean | null
          location?: string | null
          name: string
          price_cents?: number | null
          reminder_sent_at?: string | null
          requires_approval?: boolean | null
          status?: Database["public"]["Enums"]["event_status"]
          tags?: string[] | null
          target_participants?: number
          updated_at?: string
          user_id: string
          view_count?: number | null
          waitlist_enabled?: boolean | null
        }
        Update: {
          attendance_count?: number | null
          capacity_unlimited?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_paid?: boolean | null
          is_public?: boolean | null
          location?: string | null
          name?: string
          price_cents?: number | null
          reminder_sent_at?: string | null
          requires_approval?: boolean | null
          status?: Database["public"]["Enums"]["event_status"]
          tags?: string[] | null
          target_participants?: number
          updated_at?: string
          user_id?: string
          view_count?: number | null
          waitlist_enabled?: boolean | null
        }
        Relationships: []
      }
      join_requests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          assigned_to: string | null
          created_at: string
          event_id: string
          has_spun: boolean
          id: string
          name: string
          user_id: string | null
          wish: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          event_id: string
          has_spun?: boolean
          id?: string
          name: string
          user_id?: string | null
          wish?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          event_id?: string
          has_spun?: boolean
          id?: string
          name?: string
          user_id?: string | null
          wish?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          language: string | null
          last_name: string | null
          notify_guest_cancellation: boolean | null
          notify_guest_checkin: boolean | null
          notify_guest_event_reminder: boolean | null
          notify_guest_join_request_status: boolean | null
          notify_guest_ticket_confirmation: boolean | null
          notify_host_cancellation: boolean | null
          notify_host_event_created: boolean | null
          notify_host_event_reminder: boolean | null
          notify_host_event_summary: boolean | null
          notify_host_join_requests: boolean | null
          notify_host_new_registration: boolean | null
          notify_organizing: boolean | null
          notify_participating: boolean | null
          notify_product_updates: boolean | null
          phone_number: string | null
          phone_verified: boolean | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          theme: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          language?: string | null
          last_name?: string | null
          notify_guest_cancellation?: boolean | null
          notify_guest_checkin?: boolean | null
          notify_guest_event_reminder?: boolean | null
          notify_guest_join_request_status?: boolean | null
          notify_guest_ticket_confirmation?: boolean | null
          notify_host_cancellation?: boolean | null
          notify_host_event_created?: boolean | null
          notify_host_event_reminder?: boolean | null
          notify_host_event_summary?: boolean | null
          notify_host_join_requests?: boolean | null
          notify_host_new_registration?: boolean | null
          notify_organizing?: boolean | null
          notify_participating?: boolean | null
          notify_product_updates?: boolean | null
          phone_number?: string | null
          phone_verified?: boolean | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          theme?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          notify_guest_cancellation?: boolean | null
          notify_guest_checkin?: boolean | null
          notify_guest_event_reminder?: boolean | null
          notify_guest_join_request_status?: boolean | null
          notify_guest_ticket_confirmation?: boolean | null
          notify_host_cancellation?: boolean | null
          notify_host_event_created?: boolean | null
          notify_host_event_reminder?: boolean | null
          notify_host_event_summary?: boolean | null
          notify_host_join_requests?: boolean | null
          notify_host_new_registration?: boolean | null
          notify_organizing?: boolean | null
          notify_participating?: boolean | null
          notify_product_updates?: boolean | null
          phone_number?: string | null
          phone_verified?: boolean | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          theme?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      ticket_categories: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          max_quantity: number | null
          name: string
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          max_quantity?: number | null
          name: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          max_quantity?: number | null
          name?: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          participant_id: string | null
          status: string
          ticket_category_id: string | null
          ticket_code: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          participant_id?: string | null
          status?: string
          ticket_category_id?: string | null
          ticket_code: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          participant_id?: string | null
          status?: string
          ticket_category_id?: string | null
          ticket_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_category_id_fkey"
            columns: ["ticket_category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_attendance_count: {
        Args: { event_id: string }
        Returns: undefined
      }
      increment_view_count: { Args: { event_id: string }; Returns: undefined }
      perform_draw: { Args: { p_event_id: string }; Returns: boolean }
      spin_wheel: { Args: { p_participant_id: string }; Returns: string }
    }
    Enums: {
      event_status: "waiting" | "active" | "completed"
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
      event_status: ["waiting", "active", "completed"],
    },
  },
} as const

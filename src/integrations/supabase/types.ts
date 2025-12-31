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
      admin_2fa_settings: {
        Row: {
          created_at: string | null
          failed_attempts: number | null
          id: string
          is_blocked: boolean | null
          is_provisioned: boolean | null
          last_failed_at: string | null
          totp_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          is_blocked?: boolean | null
          is_provisioned?: boolean | null
          last_failed_at?: string | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          is_blocked?: boolean | null
          is_provisioned?: boolean | null
          last_failed_at?: string | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_2fa_settings_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          allowed_tabs: string[]
          can_manage_applications: boolean
          can_manage_forms: boolean
          can_manage_gallery: boolean
          can_manage_glossary: boolean
          can_manage_notifications: boolean
          can_manage_rules: boolean
          can_manage_updates: boolean
          can_manage_users: boolean
          can_manage_whiteboard: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          allowed_tabs?: string[]
          can_manage_applications?: boolean
          can_manage_forms?: boolean
          can_manage_gallery?: boolean
          can_manage_glossary?: boolean
          can_manage_notifications?: boolean
          can_manage_rules?: boolean
          can_manage_updates?: boolean
          can_manage_users?: boolean
          can_manage_whiteboard?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          allowed_tabs?: string[]
          can_manage_applications?: boolean
          can_manage_forms?: boolean
          can_manage_gallery?: boolean
          can_manage_glossary?: boolean
          can_manage_notifications?: boolean
          can_manage_rules?: boolean
          can_manage_updates?: boolean
          can_manage_users?: boolean
          can_manage_whiteboard?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: number
          is_published: boolean | null
          title: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: number
          is_published?: boolean | null
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: number
          is_published?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_announcements_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_stats: {
        Row: {
          approved_count: number
          created_at: string
          id: string
          pending_count: number
          rejected_count: number
          revision_requested_count: number
          stat_date: string
          total_applications: number
          updated_at: string
        }
        Insert: {
          approved_count?: number
          created_at?: string
          id?: string
          pending_count?: number
          rejected_count?: number
          revision_requested_count?: number
          stat_date: string
          total_applications?: number
          updated_at?: string
        }
        Update: {
          approved_count?: number
          created_at?: string
          id?: string
          pending_count?: number
          rejected_count?: number
          revision_requested_count?: number
          stat_date?: string
          total_applications?: number
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          admin_note: string | null
          ai_confidence_score: number | null
          ai_decision: string | null
          ai_evaluated_at: string | null
          ai_evaluation: Json | null
          application_number: string | null
          content: Json
          content_history: Json | null
          created_at: string
          id: number
          parent_application_id: number | null
          revision_notes: Json | null
          revision_requested_fields: Json | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          ai_confidence_score?: number | null
          ai_decision?: string | null
          ai_evaluated_at?: string | null
          ai_evaluation?: Json | null
          application_number?: string | null
          content: Json
          content_history?: Json | null
          created_at?: string
          id?: number
          parent_application_id?: number | null
          revision_notes?: Json | null
          revision_requested_fields?: Json | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          ai_confidence_score?: number | null
          ai_decision?: string | null
          ai_evaluated_at?: string | null
          ai_evaluation?: Json | null
          application_number?: string | null
          content?: Json
          content_history?: Json | null
          created_at?: string
          id?: number
          parent_application_id?: number | null
          revision_notes?: Json | null
          revision_requested_fields?: Json | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_parent_application_id_fkey"
            columns: ["parent_application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_applications_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      form_templates: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          questions: Json
          settings: Json
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          settings?: Json
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          settings?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_form_templates_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          height: number | null
          id: string
          mime_type: string | null
          optimized_size: number
          original_size: number
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          height?: number | null
          id?: string
          mime_type?: string | null
          optimized_size: number
          original_size: number
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          optimized_size?: number
          original_size?: number
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gallery_images_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          category: string
          created_at: string
          definition: string
          examples: Json | null
          full_name: string | null
          id: string
          is_critical: boolean | null
          order_index: number | null
          term: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          definition: string
          examples?: Json | null
          full_name?: string | null
          id?: string
          is_critical?: boolean | null
          order_index?: number | null
          term: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          definition?: string
          examples?: Json | null
          full_name?: string | null
          id?: string
          is_critical?: boolean | null
          order_index?: number | null
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_recipients: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notification_recipients_notification"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notification_recipients_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_global: boolean | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          created_at: string
          discord_id: string | null
          id: string
          is_banned: boolean
          is_whitelist_approved: boolean | null
          steam_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          discord_id?: string | null
          id: string
          is_banned?: boolean
          is_whitelist_approved?: boolean | null
          steam_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          discord_id?: string | null
          id?: string
          is_banned?: boolean
          is_whitelist_approved?: boolean | null
          steam_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          data: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          data?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rules_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      updates: {
        Row: {
          author_id: string | null
          category: string
          content: Json
          cover_image_url: string | null
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content?: Json
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: Json
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_updates_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_admin_permissions: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_admin_permissions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_admin_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_admin_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_global_notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_global_notification_reads_notification"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_global_notification_reads_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_global_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
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
      whiteboards: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          scene_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scene_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scene_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_whiteboards_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_2fa_status: {
        Row: {
          created_at: string | null
          failed_attempts: number | null
          id: string | null
          is_blocked: boolean | null
          is_provisioned: boolean | null
          last_failed_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string | null
          is_blocked?: boolean | null
          is_provisioned?: boolean | null
          last_failed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string | null
          is_blocked?: boolean | null
          is_provisioned?: boolean | null
          last_failed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_2fa_settings_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs_safe: {
        Row: {
          action: string | null
          changed_fields: string[] | null
          created_at: string | null
          id: string | null
          ip_address_masked: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent_short: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string | null
          ip_address_masked?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent_short?: never
          user_id?: string | null
        }
        Update: {
          action?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string | null
          ip_address_masked?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent_short?: never
          user_id?: string | null
        }
        Relationships: []
      }
      form_templates_public: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          questions: Json | null
          settings: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          questions?: Json | null
          settings?: never
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          questions?: Json | null
          settings?: never
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_images_public: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_path: string | null
          height: number | null
          id: string | null
          mime_type: string | null
          optimized_size: number | null
          original_size: number | null
          url: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          height?: number | null
          id?: string | null
          mime_type?: string | null
          optimized_size?: number | null
          original_size?: number | null
          url?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          height?: number | null
          id?: string | null
          mime_type?: string | null
          optimized_size?: number | null
          original_size?: number | null
          url?: string | null
          width?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_tab: {
        Args: { _tab_name: string; _user_id: string }
        Returns: boolean
      }
      can_manage: {
        Args: { _feature: string; _user_id: string }
        Returns: boolean
      }
      cleanup_old_audit_logs: { Args: never; Returns: number }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          allowed_tabs: string[]
          can_manage_applications: boolean
          can_manage_forms: boolean
          can_manage_gallery: boolean
          can_manage_glossary: boolean
          can_manage_notifications: boolean
          can_manage_rules: boolean
          can_manage_updates: boolean
          can_manage_users: boolean
          can_manage_whiteboard: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "admin_permissions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_any_admin_permission: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      record_totp_result: {
        Args: { p_success: boolean; p_user_id: string }
        Returns: Json
      }
      verify_form_access_code: {
        Args: { p_code: string; p_form_id: string }
        Returns: boolean
      }
      verify_totp_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
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
      app_role: ["admin", "moderator", "user", "super_admin"],
    },
  },
} as const

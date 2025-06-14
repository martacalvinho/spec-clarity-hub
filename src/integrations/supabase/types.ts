export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          date_created: string
          id: string
          material_id: string | null
          message: string
          project_id: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"]
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_created?: string
          id?: string
          material_id?: string | null
          message: string
          project_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_created?: string
          id?: string
          material_id?: string | null
          message?: string
          project_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["client_status"]
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturer_notes: {
        Row: {
          contact_date: string
          created_at: string
          delivery_time: string | null
          id: string
          manufacturer_id: string
          material_discussed_id: string | null
          notes: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          contact_date: string
          created_at?: string
          delivery_time?: string | null
          id?: string
          manufacturer_id: string
          material_discussed_id?: string | null
          notes: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          contact_date?: string
          created_at?: string
          delivery_time?: string | null
          id?: string
          manufacturer_id?: string
          material_discussed_id?: string | null
          notes?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturer_notes_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manufacturer_notes_material_discussed_id_fkey"
            columns: ["material_discussed_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manufacturer_notes_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          studio_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          studio_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          studio_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manufacturers_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string
          created_at: string
          dimensions: string | null
          id: string
          location: string | null
          manufacturer_id: string | null
          name: string
          notes: string | null
          reference_sku: string | null
          studio_id: string
          subcategory: string | null
          tag: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          dimensions?: string | null
          id?: string
          location?: string | null
          manufacturer_id?: string | null
          name: string
          notes?: string | null
          reference_sku?: string | null
          studio_id: string
          subcategory?: string | null
          tag?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          dimensions?: string | null
          id?: string
          location?: string | null
          manufacturer_id?: string | null
          name?: string
          notes?: string | null
          reference_sku?: string | null
          studio_id?: string
          subcategory?: string | null
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_materials: {
        Row: {
          category: string
          created_at: string
          id: string
          manufacturer_name: string | null
          material_name: string
          notes: string | null
          processed: boolean
          processed_date: string | null
          studio_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          manufacturer_name?: string | null
          material_name: string
          notes?: string | null
          processed?: boolean
          processed_date?: string | null
          studio_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          manufacturer_name?: string | null
          material_name?: string
          notes?: string | null
          processed?: boolean
          processed_date?: string | null
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_materials_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      proj_materials: {
        Row: {
          created_at: string
          date_added: string
          id: string
          location: string | null
          material_id: string
          notes: string | null
          project_id: string
          quantity: number | null
          studio_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_added?: string
          id?: string
          location?: string | null
          material_id: string
          notes?: string | null
          project_id: string
          quantity?: number | null
          studio_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_added?: string
          id?: string
          location?: string | null
          material_id?: string
          notes?: string | null
          project_id?: string
          quantity?: number | null
          studio_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proj_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proj_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proj_materials_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string
          end_date: string | null
          id: string
          name: string
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          studio_id: string
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          studio_id: string
          type: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          studio_id?: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          created_at: string
          id: string
          name: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_studio_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_status: "active" | "resolved" | "dismissed"
      client_status: "active" | "inactive" | "prospect"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      project_type:
        | "residential"
        | "commercial"
        | "hospitality"
        | "healthcare"
        | "education"
        | "retail"
        | "office"
      subscription_tier: "starter" | "professional" | "enterprise"
      user_role: "admin" | "studio_user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["low", "medium", "high", "critical"],
      alert_status: ["active", "resolved", "dismissed"],
      client_status: ["active", "inactive", "prospect"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      project_type: [
        "residential",
        "commercial",
        "hospitality",
        "healthcare",
        "education",
        "retail",
        "office",
      ],
      subscription_tier: ["starter", "professional", "enterprise"],
      user_role: ["admin", "studio_user"],
    },
  },
} as const

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
      considered_materials: {
        Row: {
          category: string
          created_at: string
          dimensions: string | null
          evaluated_by: string
          id: string
          location: string | null
          manufacturer_id: string | null
          material_name: string
          notes: string | null
          photo_url: string | null
          project_id: string
          reference_sku: string | null
          selected_material_id: string | null
          studio_id: string
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          dimensions?: string | null
          evaluated_by: string
          id?: string
          location?: string | null
          manufacturer_id?: string | null
          material_name: string
          notes?: string | null
          photo_url?: string | null
          project_id: string
          reference_sku?: string | null
          selected_material_id?: string | null
          studio_id: string
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          dimensions?: string | null
          evaluated_by?: string
          id?: string
          location?: string | null
          manufacturer_id?: string | null
          material_name?: string
          notes?: string | null
          photo_url?: string | null
          project_id?: string
          reference_sku?: string | null
          selected_material_id?: string | null
          studio_id?: string
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_considered_materials_manufacturer_id"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_considered_materials_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_considered_materials_selected_material_id"
            columns: ["selected_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_considered_materials_studio_id"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_materials: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          dimensions: string | null
          id: string
          location: string | null
          manufacturer_name: string | null
          name: string
          notes: string | null
          reference_sku: string | null
          rejected_at: string | null
          rejected_by: string | null
          status: string
          studio_id: string
          subcategory: string | null
          submission_id: string
          tag: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          dimensions?: string | null
          id?: string
          location?: string | null
          manufacturer_name?: string | null
          name: string
          notes?: string | null
          reference_sku?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          studio_id: string
          subcategory?: string | null
          submission_id: string
          tag?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          dimensions?: string | null
          id?: string
          location?: string | null
          manufacturer_name?: string | null
          name?: string
          notes?: string | null
          reference_sku?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          studio_id?: string
          subcategory?: string | null
          submission_id?: string
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_materials_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_materials_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_materials_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_materials_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pdf_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          message: string
          status: string
          studio_id: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          studio_id: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          studio_id?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          monthly_materials_estimate: number
          onboarding_interest: boolean
          phone: string | null
          selected_plan: string
          status: string
          studio_name: string
          updated_at: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          monthly_materials_estimate: number
          onboarding_interest?: boolean
          phone?: string | null
          selected_plan: string
          status?: string
          studio_name: string
          updated_at?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          monthly_materials_estimate?: number
          onboarding_interest?: boolean
          phone?: string | null
          selected_plan?: string
          status?: string
          studio_name?: string
          updated_at?: string
        }
        Relationships: []
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
      material_overages: {
        Row: {
          created_at: string
          id: string
          month_year: string
          overage_count: number
          per_material_rate: number
          studio_id: string
          total_charge: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_year: string
          overage_count?: number
          per_material_rate?: number
          studio_id: string
          total_charge?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          overage_count?: number
          per_material_rate?: number
          studio_id?: string
          total_charge?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_overages_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      material_price_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          id: string
          material_id: string
          price_per_sqft: number | null
          price_per_unit: number | null
          studio_id: string
          total_area: number | null
          total_units: number | null
          unit_type: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          material_id: string
          price_per_sqft?: number | null
          price_per_unit?: number | null
          studio_id: string
          total_area?: number | null
          total_units?: number | null
          unit_type?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          material_id?: string
          price_per_sqft?: number | null
          price_per_unit?: number | null
          studio_id?: string
          total_area?: number | null
          total_units?: number | null
          unit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_price_history_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_versions: {
        Row: {
          category: string
          change_reason: string | null
          changed_by: string
          created_at: string
          dimensions: string | null
          id: string
          location: string | null
          manufacturer_id: string | null
          material_id: string
          model: string | null
          name: string
          notes: string | null
          photo_url: string | null
          price_per_sqft: number | null
          price_per_unit: number | null
          reference_sku: string | null
          studio_id: string
          subcategory: string | null
          tag: string | null
          total_area: number | null
          total_units: number | null
          unit_type: string | null
          version_number: number
        }
        Insert: {
          category: string
          change_reason?: string | null
          changed_by: string
          created_at?: string
          dimensions?: string | null
          id?: string
          location?: string | null
          manufacturer_id?: string | null
          material_id: string
          model?: string | null
          name: string
          notes?: string | null
          photo_url?: string | null
          price_per_sqft?: number | null
          price_per_unit?: number | null
          reference_sku?: string | null
          studio_id: string
          subcategory?: string | null
          tag?: string | null
          total_area?: number | null
          total_units?: number | null
          unit_type?: string | null
          version_number?: number
        }
        Update: {
          category?: string
          change_reason?: string | null
          changed_by?: string
          created_at?: string
          dimensions?: string | null
          id?: string
          location?: string | null
          manufacturer_id?: string | null
          material_id?: string
          model?: string | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          price_per_sqft?: number | null
          price_per_unit?: number | null
          reference_sku?: string | null
          studio_id?: string
          subcategory?: string | null
          tag?: string | null
          total_area?: number | null
          total_units?: number | null
          unit_type?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_material_versions_manufacturer_id"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_material_versions_material_id"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_material_versions_studio_id"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          certifications: string | null
          cost_band: string | null
          created_at: string
          created_by: string | null
          dimensions: string | null
          finish_color: string | null
          fire_rating: string | null
          id: string
          last_price_update: string | null
          location: string | null
          manufacturer_id: string | null
          model: string | null
          name: string
          notes: string | null
          photo_url: string | null
          price_per_sqft: number | null
          price_per_unit: number | null
          product_sheet_url: string | null
          product_url: string | null
          reference_sku: string | null
          studio_id: string
          subcategory: string | null
          tag: string | null
          thumbnail_url: string | null
          total_area: number | null
          total_units: number | null
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          category: string
          certifications?: string | null
          cost_band?: string | null
          created_at?: string
          created_by?: string | null
          dimensions?: string | null
          finish_color?: string | null
          fire_rating?: string | null
          id?: string
          last_price_update?: string | null
          location?: string | null
          manufacturer_id?: string | null
          model?: string | null
          name: string
          notes?: string | null
          photo_url?: string | null
          price_per_sqft?: number | null
          price_per_unit?: number | null
          product_sheet_url?: string | null
          product_url?: string | null
          reference_sku?: string | null
          studio_id: string
          subcategory?: string | null
          tag?: string | null
          thumbnail_url?: string | null
          total_area?: number | null
          total_units?: number | null
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          certifications?: string | null
          cost_band?: string | null
          created_at?: string
          created_by?: string | null
          dimensions?: string | null
          finish_color?: string | null
          fire_rating?: string | null
          id?: string
          last_price_update?: string | null
          location?: string | null
          manufacturer_id?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          price_per_sqft?: number | null
          price_per_unit?: number | null
          product_sheet_url?: string | null
          product_url?: string | null
          reference_sku?: string | null
          studio_id?: string
          subcategory?: string | null
          tag?: string | null
          thumbnail_url?: string | null
          total_area?: number | null
          total_units?: number | null
          unit_type?: string | null
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
      pdf_submissions: {
        Row: {
          bucket_id: string
          client_id: string | null
          created_at: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          object_path: string | null
          processed_at: string | null
          processed_by: string | null
          project_id: string | null
          status: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          bucket_id?: string
          client_id?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          object_path?: string | null
          processed_at?: string | null
          processed_by?: string | null
          project_id?: string | null
          status?: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          client_id?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          object_path?: string | null
          processed_at?: string | null
          processed_by?: string | null
          project_id?: string | null
          status?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_submissions_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_submissions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_manufacturers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contact_name: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          studio_id: string
          submission_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contact_name?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          studio_id: string
          submission_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          studio_id?: string
          submission_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_manufacturers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pdf_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_materials: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          client_id: string | null
          created_at: string
          created_by: string
          dimensions: string | null
          id: string
          location: string | null
          manufacturer_id: string | null
          manufacturer_name: string | null
          model: string | null
          name: string
          notes: string | null
          project_id: string | null
          reference_sku: string | null
          status: string
          studio_id: string
          subcategory: string | null
          submission_id: string | null
          tag: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: string
          client_id?: string | null
          created_at?: string
          created_by: string
          dimensions?: string | null
          id?: string
          location?: string | null
          manufacturer_id?: string | null
          manufacturer_name?: string | null
          model?: string | null
          name: string
          notes?: string | null
          project_id?: string | null
          reference_sku?: string | null
          status?: string
          studio_id: string
          subcategory?: string | null
          submission_id?: string | null
          tag?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          client_id?: string | null
          created_at?: string
          created_by?: string
          dimensions?: string | null
          id?: string
          location?: string | null
          manufacturer_id?: string | null
          manufacturer_name?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          project_id?: string | null
          reference_sku?: string | null
          status?: string
          studio_id?: string
          subcategory?: string | null
          submission_id?: string | null
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_materials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_materials_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_materials_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "pdf_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      proj_materials: {
        Row: {
          cost_per_sqft: number | null
          cost_per_unit: number | null
          created_at: string
          date_added: string
          id: string
          location: string | null
          material_id: string
          notes: string | null
          project_id: string
          quantity: number | null
          square_feet: number | null
          studio_id: string
          total_cost: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          cost_per_sqft?: number | null
          cost_per_unit?: number | null
          created_at?: string
          date_added?: string
          id?: string
          location?: string | null
          material_id: string
          notes?: string | null
          project_id: string
          quantity?: number | null
          square_feet?: number | null
          studio_id: string
          total_cost?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          cost_per_sqft?: number | null
          cost_per_unit?: number | null
          created_at?: string
          date_added?: string
          id?: string
          location?: string | null
          material_id?: string
          notes?: string | null
          project_id?: string
          quantity?: number | null
          square_feet?: number | null
          studio_id?: string
          total_cost?: number | null
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
          billing_preference: string | null
          created_at: string
          current_month: string | null
          current_month_materials: number | null
          id: string
          name: string
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          billing_preference?: string | null
          created_at?: string
          current_month?: string | null
          current_month_materials?: number | null
          id?: string
          name: string
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          billing_preference?: string | null
          created_at?: string
          current_month?: string | null
          current_month_materials?: number | null
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
      calculate_similarity: {
        Args: { text1: string; text2: string }
        Returns: number
      }
      find_similar_manufacturers: {
        Args: {
          studio_id_param: string
          manufacturer_name_param: string
          similarity_threshold?: number
        }
        Returns: {
          id: string
          name: string
          contact_name: string
          email: string
          phone: string
          website: string
          notes: string
          similarity_score: number
        }[]
      }
      find_similar_materials: {
        Args: {
          studio_id_param: string
          material_name_param: string
          category_param: string
          manufacturer_id_param?: string
          similarity_threshold?: number
        }
        Returns: {
          id: string
          name: string
          category: string
          subcategory: string
          manufacturer_name: string
          manufacturer_id: string
          reference_sku: string
          dimensions: string
          similarity_score: number
        }[]
      }
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

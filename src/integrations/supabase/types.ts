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
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account: string | null
          agency: string | null
          balance_current: number | null
          balance_initial: number | null
          bank_id: string | null
          created_at: string
          id: string
          is_active: boolean
          pix_key: string | null
          type: Database["public"]["Enums"]["bank_account_type"]
        }
        Insert: {
          account?: string | null
          agency?: string | null
          balance_current?: number | null
          balance_initial?: number | null
          bank_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          pix_key?: string | null
          type?: Database["public"]["Enums"]["bank_account_type"]
        }
        Update: {
          account?: string | null
          agency?: string | null
          balance_current?: number | null
          balance_initial?: number | null
          bank_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          pix_key?: string | null
          type?: Database["public"]["Enums"]["bank_account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          bacen_code: string | null
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          bacen_code?: string | null
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          bacen_code?: string | null
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      cashback_transactions: {
        Row: {
          balance_after: number
          client_id: string
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          type: Database["public"]["Enums"]["cashback_type"]
          value: number
        }
        Insert: {
          balance_after?: number
          client_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          type: Database["public"]["Enums"]["cashback_type"]
          value: number
        }
        Update: {
          balance_after?: number
          client_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          type?: Database["public"]["Enums"]["cashback_type"]
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "cashback_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          birth_date: string | null
          cashback_balance: number
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          email2: string | null
          fiscal_type: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          notes_internal: string | null
          phone: string | null
          phone2: string | null
          resp1_cpf: string | null
          resp1_email: string | null
          resp1_name: string | null
          resp1_phone: string | null
          resp2_cpf: string | null
          resp2_email: string | null
          resp2_name: string | null
          resp2_phone: string | null
          rg_ie: string | null
          tier: Database["public"]["Enums"]["client_tier"]
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          birth_date?: string | null
          cashback_balance?: number
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          email2?: string | null
          fiscal_type?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          notes_internal?: string | null
          phone?: string | null
          phone2?: string | null
          resp1_cpf?: string | null
          resp1_email?: string | null
          resp1_name?: string | null
          resp1_phone?: string | null
          resp2_cpf?: string | null
          resp2_email?: string | null
          resp2_name?: string | null
          resp2_phone?: string | null
          rg_ie?: string | null
          tier?: Database["public"]["Enums"]["client_tier"]
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          birth_date?: string | null
          cashback_balance?: number
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          email2?: string | null
          fiscal_type?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          notes_internal?: string | null
          phone?: string | null
          phone2?: string | null
          resp1_cpf?: string | null
          resp1_email?: string | null
          resp1_name?: string | null
          resp1_phone?: string | null
          resp2_cpf?: string | null
          resp2_email?: string | null
          resp2_name?: string | null
          resp2_phone?: string | null
          rg_ie?: string | null
          tier?: Database["public"]["Enums"]["client_tier"]
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cashback_pct_padrao: number | null
          certificado_digital_url: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          ie: string | null
          im: string | null
          logo_url: string | null
          nome_fantasia: string | null
          phone: string | null
          razao_social: string
          regime_tributario: string | null
          responsavel_cpf: string | null
          responsavel_nome: string | null
          site: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cashback_pct_padrao?: number | null
          certificado_digital_url?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          phone?: string | null
          razao_social: string
          regime_tributario?: string | null
          responsavel_cpf?: string | null
          responsavel_nome?: string | null
          site?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cashback_pct_padrao?: number | null
          certificado_digital_url?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          im?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          phone?: string | null
          razao_social?: string
          regime_tributario?: string | null
          responsavel_cpf?: string | null
          responsavel_nome?: string | null
          site?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          category: Database["public"]["Enums"]["cost_center_category"]
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["cost_center_category"]
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["cost_center_category"]
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          deliverer_id: string | null
          id: string
          lat_delivery: number | null
          lng_delivery: number | null
          notes: string | null
          order_id: string
          pickup_at: string | null
          proof_photo_url: string | null
          receiver_name: string | null
          receiver_phone: string | null
          receiver_role: string | null
          route_map_url: string | null
          status: Database["public"]["Enums"]["delivery_status"]
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          deliverer_id?: string | null
          id?: string
          lat_delivery?: number | null
          lng_delivery?: number | null
          notes?: string | null
          order_id: string
          pickup_at?: string | null
          proof_photo_url?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          receiver_role?: string | null
          route_map_url?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          deliverer_id?: string | null
          id?: string
          lat_delivery?: number | null
          lng_delivery?: number | null
          notes?: string | null
          order_id?: string
          pickup_at?: string | null
          proof_photo_url?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          receiver_role?: string | null
          route_map_url?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          benefits: Json | null
          birth_date: string | null
          break_min: number | null
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          cpf: string | null
          created_at: string
          department: string | null
          docs: Json | null
          email: string | null
          fired_at: string | null
          hired_at: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          photo_url: string | null
          pis: string | null
          rg: string | null
          role: string | null
          salary: number | null
          updated_at: string
          user_id: string | null
          work_end: string | null
          work_start: string | null
          workdays: string[] | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          benefits?: Json | null
          birth_date?: string | null
          break_min?: number | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          docs?: Json | null
          email?: string | null
          fired_at?: string | null
          hired_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          pis?: string | null
          rg?: string | null
          role?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string | null
          work_end?: string | null
          work_start?: string | null
          workdays?: string[] | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          benefits?: Json | null
          birth_date?: string | null
          break_min?: number | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          docs?: Json | null
          email?: string | null
          fired_at?: string | null
          hired_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          pis?: string | null
          rg?: string | null
          role?: string | null
          salary?: number | null
          updated_at?: string
          user_id?: string | null
          work_end?: string | null
          work_start?: string | null
          workdays?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          bank_account_id: string | null
          cost_center_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          installments: number | null
          is_recurring: boolean | null
          nf_url: string | null
          paid_at: string | null
          paid_value: number | null
          recurrence_day: number | null
          status: Database["public"]["Enums"]["financial_status"]
          supplier_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          bank_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          installments?: number | null
          is_recurring?: boolean | null
          nf_url?: string | null
          paid_at?: string | null
          paid_value?: number | null
          recurrence_day?: number | null
          status?: Database["public"]["Enums"]["financial_status"]
          supplier_id?: string | null
          total: number
          updated_at?: string
        }
        Update: {
          bank_account_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          installments?: number | null
          is_recurring?: boolean | null
          nf_url?: string | null
          paid_at?: string | null
          paid_value?: number | null
          recurrence_day?: number | null
          status?: Database["public"]["Enums"]["financial_status"]
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payables_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_integrations: {
        Row: {
          created_at: string
          environment: string
          extra: Json
          id: string
          is_active: boolean
          notification_email: string | null
          provider: string
          public_key: string | null
          statement_descriptor: string | null
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string
          environment?: string
          extra?: Json
          id?: string
          is_active?: boolean
          notification_email?: string | null
          provider?: string
          public_key?: string | null
          statement_descriptor?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string
          environment?: string
          extra?: Json
          id?: string
          is_active?: boolean
          notification_email?: string | null
          provider?: string
          public_key?: string | null
          statement_descriptor?: string | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          currency: string
          description: string | null
          expires_at: string | null
          id: string
          method: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          order_id: string | null
          paid_at: string | null
          payer_doc: string | null
          payer_email: string | null
          provider: string
          qr_code: string | null
          qr_code_base64: string | null
          raw_response: Json | null
          raw_webhook: Json | null
          receivable_id: string | null
          status: string
          status_detail: string | null
          ticket_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          method: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          payer_doc?: string | null
          payer_email?: string | null
          provider?: string
          qr_code?: string | null
          qr_code_base64?: string | null
          raw_response?: Json | null
          raw_webhook?: Json | null
          receivable_id?: string | null
          status?: string
          status_detail?: string | null
          ticket_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          method?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          payer_doc?: string | null
          payer_email?: string | null
          provider?: string
          qr_code?: string | null
          qr_code_base64?: string | null
          raw_response?: Json | null
          raw_webhook?: Json | null
          receivable_id?: string | null
          status?: string
          status_detail?: string | null
          ticket_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          aliquota_cofins: number | null
          aliquota_icms: number | null
          aliquota_icms_st: number | null
          aliquota_ipi: number | null
          aliquota_pis: number | null
          brand: string | null
          cashback_pct: number | null
          category_id: string | null
          cest: string | null
          cfop: string | null
          cfop_external: string | null
          cfop_internal: string | null
          cnpj_fabricante: string | null
          codigo_anp: string | null
          codigo_beneficio_fiscal: string | null
          color: string | null
          cost_avg: number | null
          cost_last: number | null
          created_at: string
          csosn: string | null
          cst_cofins: string | null
          cst_icms: string | null
          cst_ipi: string | null
          cst_pis: string | null
          description_long: string | null
          description_short: string | null
          dim_height: number | null
          dim_length: number | null
          dim_width: number | null
          ean: string | null
          ean_tributavel: string | null
          escala_relevante: string | null
          expiry_days: number | null
          fator_conversao_tributavel: number | null
          gtin_embalagem: string | null
          id: string
          image_main_url: string | null
          images: Json | null
          informacoes_adicionais: string | null
          is_active: boolean
          manufacturer: string | null
          margin_pct: number | null
          material: string | null
          name: string
          ncm: string | null
          origem: string | null
          origin: Database["public"]["Enums"]["product_origin"] | null
          peso_bruto_kg: number | null
          peso_liquido_kg: number | null
          price_bronze: number | null
          price_diamante: number | null
          price_min: number | null
          price_ouro: number | null
          price_prata: number | null
          price_sale: number
          qty_per_pack: number | null
          sku: string | null
          stock_location: string | null
          stock_max: number | null
          stock_min: number | null
          stock_qty: number
          unidade_tributavel: string | null
          unit_measure: string | null
          updated_at: string
          valor_aproximado_tributos: number | null
          weight_kg: number | null
        }
        Insert: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_icms_st?: number | null
          aliquota_ipi?: number | null
          aliquota_pis?: number | null
          brand?: string | null
          cashback_pct?: number | null
          category_id?: string | null
          cest?: string | null
          cfop?: string | null
          cfop_external?: string | null
          cfop_internal?: string | null
          cnpj_fabricante?: string | null
          codigo_anp?: string | null
          codigo_beneficio_fiscal?: string | null
          color?: string | null
          cost_avg?: number | null
          cost_last?: number | null
          created_at?: string
          csosn?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_ipi?: string | null
          cst_pis?: string | null
          description_long?: string | null
          description_short?: string | null
          dim_height?: number | null
          dim_length?: number | null
          dim_width?: number | null
          ean?: string | null
          ean_tributavel?: string | null
          escala_relevante?: string | null
          expiry_days?: number | null
          fator_conversao_tributavel?: number | null
          gtin_embalagem?: string | null
          id?: string
          image_main_url?: string | null
          images?: Json | null
          informacoes_adicionais?: string | null
          is_active?: boolean
          manufacturer?: string | null
          margin_pct?: number | null
          material?: string | null
          name: string
          ncm?: string | null
          origem?: string | null
          origin?: Database["public"]["Enums"]["product_origin"] | null
          peso_bruto_kg?: number | null
          peso_liquido_kg?: number | null
          price_bronze?: number | null
          price_diamante?: number | null
          price_min?: number | null
          price_ouro?: number | null
          price_prata?: number | null
          price_sale?: number
          qty_per_pack?: number | null
          sku?: string | null
          stock_location?: string | null
          stock_max?: number | null
          stock_min?: number | null
          stock_qty?: number
          unidade_tributavel?: string | null
          unit_measure?: string | null
          updated_at?: string
          valor_aproximado_tributos?: number | null
          weight_kg?: number | null
        }
        Update: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_icms_st?: number | null
          aliquota_ipi?: number | null
          aliquota_pis?: number | null
          brand?: string | null
          cashback_pct?: number | null
          category_id?: string | null
          cest?: string | null
          cfop?: string | null
          cfop_external?: string | null
          cfop_internal?: string | null
          cnpj_fabricante?: string | null
          codigo_anp?: string | null
          codigo_beneficio_fiscal?: string | null
          color?: string | null
          cost_avg?: number | null
          cost_last?: number | null
          created_at?: string
          csosn?: string | null
          cst_cofins?: string | null
          cst_icms?: string | null
          cst_ipi?: string | null
          cst_pis?: string | null
          description_long?: string | null
          description_short?: string | null
          dim_height?: number | null
          dim_length?: number | null
          dim_width?: number | null
          ean?: string | null
          ean_tributavel?: string | null
          escala_relevante?: string | null
          expiry_days?: number | null
          fator_conversao_tributavel?: number | null
          gtin_embalagem?: string | null
          id?: string
          image_main_url?: string | null
          images?: Json | null
          informacoes_adicionais?: string | null
          is_active?: boolean
          manufacturer?: string | null
          margin_pct?: number | null
          material?: string | null
          name?: string
          ncm?: string | null
          origem?: string | null
          origin?: Database["public"]["Enums"]["product_origin"] | null
          peso_bruto_kg?: number | null
          peso_liquido_kg?: number | null
          price_bronze?: number | null
          price_diamante?: number | null
          price_min?: number | null
          price_ouro?: number | null
          price_prata?: number | null
          price_sale?: number
          qty_per_pack?: number | null
          sku?: string | null
          stock_location?: string | null
          stock_max?: number | null
          stock_min?: number | null
          stock_qty?: number
          unidade_tributavel?: string | null
          unit_measure?: string | null
          updated_at?: string
          valor_aproximado_tributos?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      receivables: {
        Row: {
          bank_account_id: string | null
          client_id: string | null
          cost_center_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          installments: number | null
          order_id: string | null
          paid_at: string | null
          paid_value: number | null
          status: Database["public"]["Enums"]["financial_status"]
          total: number
          updated_at: string
        }
        Insert: {
          bank_account_id?: string | null
          client_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          installments?: number | null
          order_id?: string | null
          paid_at?: string | null
          paid_value?: number | null
          status?: Database["public"]["Enums"]["financial_status"]
          total: number
          updated_at?: string
        }
        Update: {
          bank_account_id?: string | null
          client_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          installments?: number | null
          order_id?: string | null
          paid_at?: string | null
          paid_value?: number | null
          status?: Database["public"]["Enums"]["financial_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_order_items: {
        Row: {
          cashback_generated: number | null
          discount_pct: number | null
          id: string
          order_id: string
          product_id: string | null
          qty: number
          service_id: string | null
          total: number
          unit_price: number
        }
        Insert: {
          cashback_generated?: number | null
          discount_pct?: number | null
          id?: string
          order_id: string
          product_id?: string | null
          qty?: number
          service_id?: string | null
          total?: number
          unit_price?: number
        }
        Update: {
          cashback_generated?: number | null
          discount_pct?: number | null
          id?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          service_id?: string | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_orders: {
        Row: {
          cashback_used: number | null
          client_id: string | null
          created_at: string
          delivery_address: Json | null
          discount_pct: number | null
          discount_value: number | null
          id: string
          installments: number | null
          notes: string | null
          order_number: number
          payment_method: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cashback_used?: number | null
          client_id?: string | null
          created_at?: string
          delivery_address?: Json | null
          discount_pct?: number | null
          discount_value?: number | null
          id?: string
          installments?: number | null
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cashback_used?: number | null
          client_id?: string | null
          created_at?: string
          delivery_address?: Json | null
          discount_pct?: number | null
          discount_value?: number | null
          id?: string
          installments?: number | null
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_professionals: {
        Row: {
          employee_id: string
          service_id: string
        }
        Insert: {
          employee_id: string
          service_id: string
        }
        Update: {
          employee_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_professionals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_professionals_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          billing_unit: string | null
          cashback_pct: number | null
          category: string | null
          code: string | null
          coverage_cities: string[] | null
          created_at: string
          description: string | null
          description_tech: string | null
          duration_min: number | null
          id: string
          images: Json | null
          is_active: boolean
          name: string
          price_base: number
          updated_at: string
        }
        Insert: {
          billing_unit?: string | null
          cashback_pct?: number | null
          category?: string | null
          code?: string | null
          coverage_cities?: string[] | null
          created_at?: string
          description?: string | null
          description_tech?: string | null
          duration_min?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean
          name: string
          price_base?: number
          updated_at?: string
        }
        Update: {
          billing_unit?: string | null
          cashback_pct?: number | null
          category?: string | null
          code?: string | null
          coverage_cities?: string[] | null
          created_at?: string
          description?: string | null
          description_tech?: string | null
          duration_min?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean
          name?: string
          price_base?: number
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          product_id: string
          qty: number
          reason: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          qty: number
          reason?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          qty?: number
          reason?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          avg_delivery_days: number | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          bank_pix: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          ie: string | null
          is_active: boolean
          nome_fantasia: string | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          razao_social: string
          rep_email: string | null
          rep_name: string | null
          rep_phone: string | null
          site: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avg_delivery_days?: number | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          bank_pix?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          nome_fantasia?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          razao_social: string
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          site?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avg_delivery_days?: number | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          bank_pix?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean
          nome_fantasia?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          razao_social?: string
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          site?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          id: string
          is_active: boolean
          last_login: string | null
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id: string
          is_active?: boolean
          last_login?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      claim_admin_if_none: { Args: never; Returns: boolean }
      enable_audit: { Args: { _table_name: string }; Returns: undefined }
      get_payment_public_config: {
        Args: never
        Returns: {
          environment: string
          is_active: boolean
          provider: string
          public_key: string
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "financeiro"
        | "vendedor"
        | "estoque"
        | "entregador"
        | "cliente"
        | "comercial"
        | "expedicao"
      bank_account_type: "corrente" | "poupanca" | "caixa"
      cashback_type: "credito" | "debito" | "expiracao" | "transferencia"
      client_tier: "bronze" | "prata" | "ouro" | "diamante"
      client_type: "pf" | "pj"
      contract_type: "clt" | "pj" | "terceirizado" | "freelancer"
      cost_center_category:
        | "fixo"
        | "variavel"
        | "imobilizado"
        | "bancario"
        | "pessoal"
      delivery_status: "aguardando" | "em_rota" | "entregue" | "falha"
      financial_status: "aberto" | "parcial" | "pago" | "vencido" | "cancelado"
      order_status:
        | "rascunho"
        | "confirmado"
        | "separando"
        | "em_rota"
        | "entregue"
        | "cancelado"
      order_type: "pdv" | "ecommerce" | "orcamento"
      product_origin: "nacional" | "importado"
      stock_movement_type: "entrada" | "saida" | "ajuste" | "inventario"
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
      app_role: [
        "admin",
        "financeiro",
        "vendedor",
        "estoque",
        "entregador",
        "cliente",
        "comercial",
        "expedicao",
      ],
      bank_account_type: ["corrente", "poupanca", "caixa"],
      cashback_type: ["credito", "debito", "expiracao", "transferencia"],
      client_tier: ["bronze", "prata", "ouro", "diamante"],
      client_type: ["pf", "pj"],
      contract_type: ["clt", "pj", "terceirizado", "freelancer"],
      cost_center_category: [
        "fixo",
        "variavel",
        "imobilizado",
        "bancario",
        "pessoal",
      ],
      delivery_status: ["aguardando", "em_rota", "entregue", "falha"],
      financial_status: ["aberto", "parcial", "pago", "vencido", "cancelado"],
      order_status: [
        "rascunho",
        "confirmado",
        "separando",
        "em_rota",
        "entregue",
        "cancelado",
      ],
      order_type: ["pdv", "ecommerce", "orcamento"],
      product_origin: ["nacional", "importado"],
      stock_movement_type: ["entrada", "saida", "ajuste", "inventario"],
    },
  },
} as const

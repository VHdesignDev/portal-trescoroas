import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createSupabaseClient() {
  // Explicitly persist session and auto-refresh tokens in the browser
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

export type Database = {
  public: {
    Tables: {
      demandas: {
        Row: {
          id: string
          foto_url: string | null
          categoria: string
          descricao: string | null
          localizacao: {
            lat: number
            lng: number
            endereco?: string
          }
          data_criacao: string
          data_resolucao: string | null
          status: 'aberta' | 'em_andamento' | 'resolvida'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          foto_url?: string | null
          categoria: string
          descricao?: string | null
          localizacao: {
            lat: number
            lng: number
            endereco?: string
          }
          data_criacao?: string
          data_resolucao?: string | null
          status?: 'aberta' | 'em_andamento' | 'resolvida'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          foto_url?: string | null
          categoria?: string
          descricao?: string | null
          localizacao?: {
            lat: number
            lng: number
            endereco?: string
          }
          data_criacao?: string
          data_resolucao?: string | null
          status?: 'aberta' | 'em_andamento' | 'resolvida'
          created_at?: string
          updated_at?: string
        }
      }
      categorias: {
        Row: {
          id: string
          nome: string
          icone: string
          cor: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          icone: string
          cor: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          icone?: string
          cor?: string
          created_at?: string
        }
      }
    }
  }
}

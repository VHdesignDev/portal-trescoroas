import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let browserClient: ReturnType<typeof createBrowserClient> | null = null
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
    })
  }
  return browserClient
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

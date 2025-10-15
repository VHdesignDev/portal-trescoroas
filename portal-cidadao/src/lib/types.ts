export interface Demanda {
  id: string
  user_id?: string | null
  foto_url: string | null
  categoria: string
  descricao: string | null
  localizacao: {
    lat: number
    lng: number
  }
  endereco?: string | null
  bairro?: string | null
  data_criacao: string
  data_resolucao: string | null
  status: 'aberta' | 'em_andamento' | 'resolvida'
  created_at: string
  updated_at: string
}

export interface Categoria {
  id: string
  nome: string
  icone: string
  cor: string
  created_at: string
}

export interface Bairro {
  id: string
  nome: string
  cidade: string
  estado: string
  created_at: string
}

export interface UserProfile {
  id: string
  nome: string
  telefone?: string | null
  endereco: string
  bairro_id?: string | null
  bairro_text?: string | null
  cep?: string | null
  created_at: string
  updated_at: string
  bairro?: Bairro
}

export interface DemandaForm {
  foto: File | null
  categoria: string
  descricao: string
  localizacao: {
    lat: number
    lng: number
  }
  endereco?: string
  bairro?: string
}

export interface UserRegistrationForm {
  email: string
  password: string
  nome: string
  telefone?: string
  endereco: string
  bairro: string
  cep?: string
}

export interface DashboardStats {
  total_demandas: number
  demandas_abertas: number
  demandas_em_andamento: number
  demandas_resolvidas: number
  tempo_medio_resolucao: number
  demandas_por_categoria: Array<{
    categoria: string
    count: number
  }>
  evolucao_mensal: Array<{
    mes: string
    abertas: number
    resolvidas: number
  }>
}

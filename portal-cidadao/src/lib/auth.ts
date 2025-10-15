import { createSupabaseClient } from './supabase'

export interface User {
  id: string
  email: string
  role: 'dev' | 'admin' | 'user'
  name?: string | null
}

export class AuthService {
  private supabase = createSupabaseClient()

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser()

    if (!user) return null

    // Buscar nome no perfil (se existir)
    let displayName: string | null = null
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('nome')
        .eq('id', user.id)
        .maybeSingle()
      displayName = profile?.nome ?? null
    } catch {}

    // Checar papéis no banco: dev tem precedência sobre admin
    let isDev = false
    let isAdmin = false
    // 1) Tenta via RPC (se existir)
    try {
      const { data: devResult } = await this.supabase.rpc('is_dev')
      isDev = Boolean(devResult)
    } catch {}
    try {
      const { data: adminResult } = await this.supabase.rpc('is_admin')
      isAdmin = Boolean(adminResult)
    } catch {}
    // 2) Fallback: consulta tabelas diretamente se RPCs não existirem/forem negadas
    if (!isDev) {
      try {
        const { data, error } = await this.supabase
          .from('dev_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!error && data) isDev = true
      } catch {}
    }
    if (!isDev && !isAdmin) { // só checa admin se não for dev
      try {
        const { data, error } = await this.supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!error && data) isAdmin = true
      } catch {}
    }

    return {
      id: user.id,
      email: user.email!,
      role: isDev ? 'dev' : (isAdmin ? 'admin' : 'user'),
      name: displayName,
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }

  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user?.role === 'admin' || false
  }
}

export const authService = new AuthService()

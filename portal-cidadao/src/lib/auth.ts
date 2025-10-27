import { getSupabaseBrowserClient } from './supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'


export interface User {
  id: string
  email: string
  role: 'dev' | 'admin' | 'user'
  name?: string | null
}

// Helper: aplica timeout a uma promise e retorna fallback se exceder
async function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        resolve(fallback)
      }
    }, ms)
    p.then((v) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve(v)
      }
    }).catch(() => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve(fallback)
      }
    })
  })
}

export class AuthService {
  private supabase = getSupabaseBrowserClient()

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
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  // Reenvia o e-mail de confirmação de cadastro
  async resendConfirmation(email: string) {
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`
    const { data, error } = await this.supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) {
      throw new Error(error.message)
    }
    return data
  }

  // Inicia fluxo de recuperação de senha (envia e-mail com link)
  async requestPasswordReset(email: string) {
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      throw new Error(error.message)
    }
    return data
  }

  // Conclui a recuperação: atualiza a senha do usuário (requer sessão de recovery ativa)
  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({ password: newPassword })
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
    // 1) Primeiro tenta sessão local (não depende de rede)
    const { data: sessionData } = await this.supabase.auth.getSession()
    const sessionUser = sessionData?.session?.user
    if (!sessionUser) {
      return null
    }

    const uid = sessionUser.id
    const email = sessionUser.email!

    // 2) Buscar nome de perfil e papéis em paralelo, com timeout curto
    const profileP = withTimeout(
      (async () =>
        await this.supabase
          .from('user_profiles')
          .select('nome')
          .eq('id', uid)
          .maybeSingle()
      )(),
      1500,
      { data: null } as any
    )

    const devRpcP = withTimeout(
      (async () => await this.supabase.rpc('is_dev'))(),
      1500,
      { data: null } as any
    )
    const adminRpcP = withTimeout(
      (async () => await this.supabase.rpc('is_admin'))(),
      1500,
      { data: null } as any
    )

    const [{ data: profile }, { data: devResult }, { data: adminResult }] = await Promise.all([
      profileP,
      devRpcP,
      adminRpcP,
    ])

    let displayName: string | null = (profile as any)?.nome ?? null

    let isDev = Boolean(devResult)
    let isAdmin = Boolean(adminResult)

    // 3) Fallback: se não for dev nem admin, tenta tabelas diretamente (também com timeout e em paralelo)
    if (!isDev && !isAdmin) {
      const devTblP = withTimeout(
        (async () =>
          await this.supabase
            .from('dev_users')
            .select('user_id')
            .eq('user_id', uid)
            .maybeSingle()
        )(),
        800,
        { data: null } as any
      )
      const admTblP = withTimeout(
        (async () =>
          await this.supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', uid)
            .maybeSingle()
        )(),
        800,
        { data: null } as any
      )

      const [{ data: d1 }, { data: a1 }] = await Promise.all([devTblP, admTblP])
      isDev = Boolean(d1)
      isAdmin = isDev ? false : Boolean(a1)
    }

    return {
      id: uid,
      email,
      role: isDev ? 'dev' : (isAdmin ? 'admin' : 'user'),
      name: displayName,
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
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

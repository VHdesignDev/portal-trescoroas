'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, authService } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  isDev: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    let mounted = true
    // Failsafe: se o Supabase estiver lento/fora, não travar a UI indefinidamente
    const loadingFailsafe = setTimeout(() => {
      if (mounted) setIsLoading(false)
    }, 3000)

    // Verificar usuário atual
    authService.getCurrentUser().then((currentUser) => {
      if (!mounted) return
      setUser(currentUser)
      setIsLoading(false)
    }).catch(() => {
      if (!mounted) return
      setIsLoading(false)
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (!mounted) return
      setUser(user)
      setIsLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(loadingFailsafe)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
  }

  const value = {
    user,
    isLoading,
    isAdmin: user?.role === 'admin' || user?.role === 'dev',
    isDev: user?.role === 'dev',
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook para proteger rotas administrativas
export function useRequireAuth(redirectTo = '/login') {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = redirectTo
    }
  }, [user, isLoading, redirectTo])

  return { user, isLoading }
}

// Hook para proteger rotas de admin
export function useRequireAdmin(redirectTo = '/') {
  const { user, isLoading, isAdmin } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      window.location.href = redirectTo
    }
  }, [user, isLoading, isAdmin, redirectTo])

  return { user, isLoading, isAdmin }
}

// Hook para proteger rotas de dev
export function useRequireDev(redirectTo = '/') {
  const { user, isLoading, isDev } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || !isDev)) {
      window.location.href = redirectTo
    }
  }, [user, isLoading, isDev, redirectTo])

  return { user, isLoading, isDev }
}

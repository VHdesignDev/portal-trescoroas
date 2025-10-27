'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/components/auth/auth-provider'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { AuthChangeEvent } from '@supabase/supabase-js'

export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Se chegar via link de recuperação, enviar para a página de redefinição
    const supabase = getSupabaseBrowserClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/auth/update-password')
      }
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    // Se o usuário já está logado, redirecionar para a página inicial
    if (!isLoading && user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const handleSuccess = () => {
    router.push('/')
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </Layout>
    )
  }

  if (user) {
    return null // Será redirecionado pelo useEffect
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        <LoginForm
          onSuccess={handleSuccess}
          onError={handleError}
        />

        <div className="text-center space-y-2 mt-6">
          <p className="text-sm text-gray-600">
            Acesso restrito para administradores da prefeitura
          </p>
          <p className="text-sm text-gray-700">
            Não tem uma conta?{' '}
            <Link href="/registro" className="font-medium text-blue-600 hover:text-blue-700">
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}

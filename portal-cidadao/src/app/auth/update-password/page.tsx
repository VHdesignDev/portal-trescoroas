"use client"

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, KeyRound } from 'lucide-react'
import { authService } from '@/lib/auth'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'


const schema = z.object({
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [attempting, setAttempting] = useState(false)


  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const attemptRecoveryFromUrl = async () => {
    if (typeof window === 'undefined') return
    setMessage(null)
    setAttempting(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const search = new URLSearchParams(window.location.search)
      const code = search.get('code')
      const token_hash = search.get('token_hash')
      const token = search.get('token')

      let didTry = false
      let hadError: string | null = null

      if (code) {
        didTry = true
        const { error } = await supabase.auth.exchangeCodeForSession({ code } as any)
        if (error) {
          hadError = 'Este link de recuperação não é mais válido. Solicite um novo e-mail.'
        }
      } else if (token_hash) {
        didTry = true
        const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash })
        if (error) {
          hadError = 'Link de recuperação inválido ou expirado. Solicite um novo e-mail.'
        }
      } else if (token) {
        didTry = true
        const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token })
        if (error) {
          hadError = 'Link de recuperação inválido ou expirado. Solicite um novo e-mail.'
        }
      }

      const hash = window.location.hash || ''
      if (hash) {
        try {
          const qs = new URLSearchParams(hash.replace(/^#/, ''))
          const access_token = qs.get('access_token')
          const refresh_token = qs.get('refresh_token')
          if (access_token && refresh_token) {
            didTry = true
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (error) {
              hadError = 'Não foi possível ativar a sessão a partir deste link. Solicite um novo e-mail.'
            }
          }
        } catch {}
      }

      const { data }: { data: { session: Session | null } } = await supabase.auth.getSession()
      const ok = !!data.session
      setIsReady(ok)
      if (!ok) {
        if (hadError) setMessage(hadError)
        else if (code) setMessage('Este link de recuperação (formato PKCE) não é válido neste navegador. Solicite um novo e-mail.')
        else if (didTry) setMessage('Não foi possível ativar a sessão com este link. Solicite um novo e-mail.')
        else setMessage('Link inválido. Solicite um novo e-mail de recuperação.')
      }
    } catch (e) {
      try { console.warn('[auth/update-password] attemptRecoveryFromUrl error', e) } catch {}
      setMessage('Ocorreu um erro ao ativar sua sessão. Solicite um novo e-mail e tente novamente.')
    } finally {
      setAttempting(false)
    }
  }


  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => { setIsReady(!!data.session) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent) => { supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => setIsReady(!!data.session)) })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  // Suporte amplo a fluxos modernos do Supabase:
  // - PKCE (?code=...)
  // - Otp por e-mail com token_hash (?token_hash=...) via verifyOtp(type: 'recovery')
  useEffect(() => {
    void attemptRecoveryFromUrl()
  }, [])


  // Fallback robusto: se existir hash com tokens, aplica a sessão manualmente
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash || ''
    try {
      const qs = new URLSearchParams(hash.replace(/^#/, ''))
      const access_token = qs.get('access_token')
      const refresh_token = qs.get('refresh_token')
      if (access_token && refresh_token) {
        const supabase = getSupabaseBrowserClient()
        supabase.auth.setSession({ access_token, refresh_token })
          .then(() => supabase.auth.getSession())
          .then(({ data }: { data: { session: Session | null } }) => setIsReady(!!data.session))
          .catch(() => { /* silencioso */ })
      }
    } catch {}
  }, [])


  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setMessage(null)
    try {
      await authService.updatePassword(data.password)
      setMessage('Senha atualizada com sucesso! Você jápode entrar com a nova senha.')
      setTimeout(() => router.push('/login'), 1200)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível atualizar a senha. O link pode ter expirado. Solicite um novo e-mail.'
      setMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Definir nova senha</CardTitle>
            <p className="text-gray-600">Crie uma nova senha para acessar sua conta</p>
          </CardHeader>
          <CardContent>
            {!isReady ? (
              <div className="text-center py-6 text-gray-700">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Preparando sua sessão...
                <div className="mt-3">
                  <Button onClick={attemptRecoveryFromUrl} disabled={attempting} variant="outline">
                    {attempting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Tentando...
                      </>
                    ) : (
                      'Tentar novamente'
                    )}
                  </Button>
                </div>
                <div className="mt-2 text-sm">
                  <Link href="/auth/reset-password" className="text-blue-600 hover:text-blue-700">Solicitar novo e-mail</Link>
                </div>
                {message && (
                  <p className="text-sm text-red-600 mt-2">{message}</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nova senha</label>
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="No mínimo 8 caracteres"
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                  <p className="text-xs text-gray-600">
                    Requisitos: mínimo 8 caracteres.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmar nova senha</label>
                  <Input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="Repita a nova senha"
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {message && (
                  <p className="text-sm text-gray-700">{message}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar senha'
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700">
                    Voltar ao login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}


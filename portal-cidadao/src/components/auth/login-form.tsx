'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lock, Mail, MailCheck } from 'lucide-react'
import { authService } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await authService.signIn(data.email, data.password)
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login'
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }

  const emailValue = watch('email')
  const [isResending, setIsResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  const handleResend = async () => {
    if (!emailValue) {
      setResendMsg('Informe seu e-mail acima para reenviar a confirmação.')
      return
    }
    try {
      setIsResending(true)
      setResendMsg(null)
      await authService.resendConfirmation(emailValue)
      setResendMsg('Enviamos um novo e-mail de confirmação. Verifique sua caixa de entrada e spam.')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível reenviar. Tente novamente em instantes.'
      setResendMsg(msg)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
        <p className="text-gray-600">Acesse sua conta</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                {...register('email')}
                type="email"
                placeholder="admin@prefeitura.gov.br"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResending || !!errors.email}
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <MailCheck className="w-4 h-4 mr-2" />
                Reenviar e-mail de confirmação
              </>
            )}
          </Button>

          {resendMsg && (
            <p className="text-xs text-gray-600 text-center">{resendMsg}</p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

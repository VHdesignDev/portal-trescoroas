'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { authService } from '@/lib/auth'
import { apiService } from '@/lib/api'
import { User, Mail, Phone, MapPin, Home, Key, ArrowLeft } from 'lucide-react'

const registroSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
  confirmPassword: z.string(),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  telefone: z.string().optional(),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  bairro: z.string().min(2, 'Informe o bairro'),
  cep: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

type RegistroFormData = z.infer<typeof registroSchema>

export default function RegistroPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
  })

  const onSubmit = async (data: RegistroFormData) => {
    try {
      setIsLoading(true)

      // Registrar usuário
      const { user } = await authService.signUp(data.email, data.password)

      if (user) {
        // Criar perfil do usuário
        await apiService.createUserProfile({
          id: user.id,
          nome: data.nome,
          telefone: data.telefone || null,
          endereco: data.endereco,
          bairro_text: data.bairro,
          cep: data.cep || null,
        })

        alert('Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.')
        router.push('/login')
      }
    } catch (error: unknown) {
      console.error('Erro no cadastro:', error)
      const message = error instanceof Error ? error.message : 'Erro ao realizar cadastro. Tente novamente.'
      alert(message)
    } finally {
      setIsLoading(false)
    }
  }

  const emailValue = watch('email')
  const [isResending, setIsResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  const handleResend = async () => {
    if (!emailValue) {
      setResendMsg('Preencha o campo de e-mail acima para reenviar a confirmação.')
      return
    }
    try {
      setIsResending(true)
      setResendMsg(null)
      await authService.resendConfirmation(emailValue)
      setResendMsg('Reenviamos o e-mail de confirmação. Confira sua caixa de entrada e spam.')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível reenviar agora. Tente novamente mais tarde.'
      setResendMsg(msg)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para Login
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Criar Conta
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Cadastre-se para reportar problemas em sua cidade
          </p>
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Senha *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="Mínimo 8 caracteres, letras e números"
                    className="pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                )}
                {!errors.password && (
                  <p className="text-xs text-gray-600 mt-1">
                    Requisitos: mínimo 8 caracteres, com pelo menos 1 letra e 1 número.
                  </p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="Repita sua senha"
                    className="pl-10"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...register('nome')}
                    placeholder="Seu nome completo"
                    className="pl-10"
                  />
                </div>
                {errors.nome && (
                  <p className="text-red-600 text-sm mt-1">{errors.nome.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Telefone (opcional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...register('telefone')}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Recomendado para receber atualizações sobre suas demandas
                </p>
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Endereço Completo *
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...register('endereco')}
                    placeholder="Rua, número, complemento"
                    className="pl-10"
                  />
                </div>
                {errors.endereco && (
                  <p className="text-red-600 text-sm mt-1">{errors.endereco.message}</p>
                )}
              </div>

              {/* Bairro */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Bairro *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <Input
                    {...register('bairro')}
                    placeholder="Digite o bairro onde mora"
                    className="pl-10"
                  />
                </div>
                {errors.bairro && (
                  <p className="text-red-600 text-sm mt-1">{errors.bairro.message}</p>
                )}
              </div>

              {/* CEP */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  CEP (opcional)
                </label>
                <Input
                  {...register('cep')}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              {/* Botão de Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando conta...
                  </div>
                ) : (
                  'Criar Conta'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
              </Button>

              {resendMsg && (
                <p className="text-xs text-gray-600 text-center">{resendMsg}</p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Link para Login */}
        <div className="text-center">
          <p className="text-sm text-gray-700">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

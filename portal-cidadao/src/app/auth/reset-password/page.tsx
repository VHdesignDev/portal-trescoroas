"use client"

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Mail } from 'lucide-react'
import { authService } from '@/lib/auth'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setMessage(null)
    try {
      await authService.requestPasswordReset(data.email)
      setSent(true)
      setMessage('Se o e-mail existir em nossa base, você receberá um link para redefinir a senha. Verifique também a caixa de spam.')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.'
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
              <Mail className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
            <p className="text-gray-600">Informe seu e-mail para receber o link de redefinição</p>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-700">{message}</p>
                <div className="flex gap-2 justify-center">
                  <Link href="/login">
                    <Button variant="outline">Ir para Login</Button>
                  </Link>
                  <Button onClick={() => setSent(false)} variant="ghost">Tentar outro e-mail</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="voce@exemplo.com"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {message && (
                  <p className="text-xs text-gray-600">{message}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de redefinição'
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


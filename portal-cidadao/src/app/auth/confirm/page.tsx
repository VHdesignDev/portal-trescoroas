"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useMemo } from "react"
import { Layout } from "@/components/layout/layout"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle } from "lucide-react"

function ConfirmContent() {
  const params = useSearchParams()
  const router = useRouter()

  const { hasError, errorDescription } = useMemo(() => {
    const err = params.get("error")
    const desc = params.get("error_description")
    return { hasError: !!err, errorDescription: desc }
  }, [params])

  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      {hasError ? (
        <div className="space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Não foi possível confirmar seu e-mail</h1>
          {errorDescription && (
            <p className="text-gray-700">{errorDescription}</p>
          )}
          <p className="text-gray-700">Tente reenviar a confirmação a partir da tela de login/registro.</p>
          <Button onClick={() => router.push("/login")}>Ir para Login</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">E-mail confirmado com sucesso!</h1>
          <p className="text-gray-700">Agora você já pode acessar sua conta.</p>
          <Button onClick={() => router.push("/login")}>Fazer Login</Button>
        </div>
      )}
    </div>
  )
}

export default function EmailConfirmPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="text-center py-12 text-gray-600">Carregando...</div>}>
        <ConfirmContent />
      </Suspense>
    </Layout>
  )
}


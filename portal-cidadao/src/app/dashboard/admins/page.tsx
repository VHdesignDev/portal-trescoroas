"use client"

import { useEffect, useState } from "react"
import { useRequireDev } from "@/components/auth/auth-provider"
import { Layout } from "@/components/layout/layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, Plus, Trash2 } from "lucide-react"

export default function AdminsPage() {
  const { user, isLoading, isDev } = useRequireDev("/")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isLoading) setReady(true)
  }, [isLoading])

  if (!ready) return null

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Administração de Usuários
          </h1>
        </div>

        <Card className="p-6">
          <p className="text-gray-700 mb-4">
            Esta área é exclusiva para desenvolvedores (dev). Aqui você poderá aprovar e revogar administradores e gerenciar devs. Em breve adicionarei a listagem e os botões de ação.
          </p>
          <div className="flex gap-2">
            <Button disabled>
              <Users className="w-4 h-4 mr-2" /> Listar usuários (em breve)
            </Button>
            <Button variant="outline" disabled>
              <Plus className="w-4 h-4 mr-2" /> Aprovar admin (em breve)
            </Button>
            <Button variant="destructive" disabled>
              <Trash2 className="w-4 h-4 mr-2" /> Revogar admin (em breve)
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Como obter acesso a esta aba</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-1">
            <li>Abra o SQL Editor do Supabase</li>
            <li>Execute 07_admin_roles.sql e 07b_dev_roles.sql</li>
            <li>
              Torne seu usuário um dev com:
              <pre className="bg-gray-50 p-2 rounded mt-2 text-sm">{`INSERT INTO public.dev_users(user_id)
SELECT id FROM auth.users WHERE email = 'seu-email@dominio.com';`}</pre>
            </li>
            <li>Saia e entre novamente no app</li>
            <li>Volte a esta página em /dashboard/admins</li>
          </ol>
        </Card>
      </div>
    </Layout>
  )
}


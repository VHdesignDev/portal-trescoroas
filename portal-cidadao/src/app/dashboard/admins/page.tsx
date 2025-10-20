"use client"

import { useEffect, useMemo, useState } from "react"
import { useRequireDev } from "@/components/auth/auth-provider"
import { Layout } from "@/components/layout/layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Users, Plus, Trash2, RefreshCcw } from "lucide-react"
import { apiService } from "@/lib/api"

function AdminManagementPanel() {
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [admins, setAdmins] = useState<Array<{ id: string; email: string; nome?: string | null }>>([])

  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Array<{ id: string; email: string; nome?: string | null }>>([])

  const adminSet = useMemo(() => new Set(admins.map(a => a.email.toLowerCase())), [admins])

  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true)
      const list = await apiService.listAdmins()
      setAdmins(list)
    } catch (e) {
      console.error(e)
      alert("Erro ao carregar administradores")
    } finally {
      setLoadingAdmins(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const handleSearch = async () => {
    try {
      setSearching(true)
      const list = await apiService.listUsers(query)
      setResults(list)
    } catch (e) {
      console.error(e)
      alert("Erro ao buscar usuários")
    } finally {
      setSearching(false)
    }
  }

  const handleAddAdmin = async (email: string) => {
    if (!confirm(`Tornar ${email} administrador?`)) return
    try {
      await apiService.addAdminByEmail(email)
      await loadAdmins()
      alert("Administrador adicionado com sucesso.")
    } catch (e: any) {
      alert(`Falha ao adicionar admin: ${e?.message || e}`)
    }
  }

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Revogar admin de ${email}?`)) return
    try {
      await apiService.removeAdminByEmail(email)
      await loadAdmins()
      alert("Admin revogado com sucesso.")
    } catch (e: any) {
      alert(`Falha ao revogar admin: ${e?.message || e}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" /> Gestão de Admins
        </h2>
        <Button variant="outline" onClick={loadAdmins} disabled={loadingAdmins}>
          <RefreshCcw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> Administradores atuais
        </h3>
        {admins.length === 0 ? (
          <p className="text-gray-600">Nenhum administrador cadastrado ainda.</p>
        ) : (
          <ul className="divide-y">
            {admins.map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.nome || a.email}</p>
                  {a.nome && <p className="text-sm text-gray-600">{a.email}</p>}
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleRemoveAdmin(a.email)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Revogar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> Buscar usuários
        </h3>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Busque por email ou nome" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button onClick={handleSearch} disabled={searching}>Buscar</Button>
        </div>
        {results.length > 0 && (
          <ul className="divide-y">
            {results.map((u) => (
              <li key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{u.nome || u.email}</p>
                  {u.nome && <p className="text-sm text-gray-600">{u.email}</p>}
                </div>
                {adminSet.has(u.email.toLowerCase()) ? (
                  <Button variant="outline" size="sm" onClick={() => handleRemoveAdmin(u.email)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Revogar admin
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleAddAdmin(u.email)}>
                    <Plus className="w-4 h-4 mr-2" /> Tornar admin
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

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

        <AdminManagementPanel />

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


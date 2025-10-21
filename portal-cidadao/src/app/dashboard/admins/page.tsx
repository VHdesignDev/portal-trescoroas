"use client"

import { useEffect, useMemo, useState } from "react"
import { useRequireDev } from "@/components/auth/auth-provider"
import { Layout } from "@/components/layout/layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Users, Plus, Trash2, RefreshCcw, AlertCircle, CheckCircle, Copy } from "lucide-react"
import { apiService } from "@/lib/api"

function InlineAlert({ type, message, onClose }: { type: 'error' | 'success' | 'info'; message: string; onClose?: () => void }) {
  const styles = {
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  } as const
  const Icon = type === 'error' ? AlertCircle : type === 'success' ? CheckCircle : AlertCircle
  return (
    <div className={`border rounded-md px-3 py-2 flex items-start gap-2 ${styles[type]}`}>
      <Icon className="w-4 h-4 mt-[2px]" />
      <div className="text-sm leading-relaxed">{message}</div>
      {onClose && (
        <button className="ml-auto text-sm underline" onClick={onClose}>Fechar</button>
      )}
    </div>
  )
}

function AdminManagementPanel() {
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [admins, setAdmins] = useState<Array<{ id: string; email: string; nome?: string | null }>>([])

  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Array<{ id: string; email: string; nome?: string | null }>>([])
  const [banner, setBanner] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null)

  const adminSet = useMemo(() => new Set(admins.map(a => a.email.toLowerCase())), [admins])

  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true)
      const list = await apiService.listAdmins()
      setAdmins(list)
      setBanner(null)
    } catch (e) {
      console.error(e)
      setBanner({
        type: 'error',
        message: 'Não foi possível carregar administradores. Verifique se os scripts 07_admin_roles.sql e 07b_dev_roles.sql foram executados no Supabase e se seu usuário está em dev_users.',
      })
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
      setBanner(null)
    } catch (e) {
      console.error(e)
      setBanner({ type: 'error', message: 'Erro ao buscar usuários. Tente novamente em instantes.' })
    } finally {
      setSearching(false)
    }
  }

  const handleAddAdmin = async (email: string) => {
    if (!confirm(`Tornar ${email} administrador?`)) return
    try {
      await apiService.addAdminByEmail(email)
      await loadAdmins()
      setBanner({ type: 'success', message: 'Administrador adicionado com sucesso.' })
    } catch (e: any) {
      setBanner({ type: 'error', message: `Falha ao adicionar admin: ${e?.message || e}` })
    }
  }

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Revogar admin de ${email}?`)) return
    try {
      await apiService.removeAdminByEmail(email)
      await loadAdmins()
      setBanner({ type: 'success', message: 'Admin revogado com sucesso.' })
    } catch (e: any) {
      setBanner({ type: 'error', message: `Falha ao revogar admin: ${e?.message || e}` })
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

      {banner && (
        <InlineAlert type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
      )}

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
          <h2 className="font-semibold text-gray-900 mb-3">Como habilitar esta área</h2>
          <p className="text-gray-700 mb-3">Caso veja erros ou a lista vazia, é provável que as permissões ainda não estejam configuradas. Siga os passos abaixo no SQL Editor do Supabase:</p>
          <ol className="list-decimal list-inside text-gray-700 space-y-1">
            <li>Execute <code className="font-mono text-sm">supabase-scripts/07_admin_roles.sql</code></li>
            <li>Execute <code className="font-mono text-sm">supabase-scripts/07b_dev_roles.sql</code></li>
            <li>
              Torne seu usuário um dev com:
              <div className="relative mt-2">
                <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">{`INSERT INTO public.dev_users(user_id)
SELECT id FROM auth.users WHERE email = 'seu-email@dominio.com';`}</pre>
              </div>
            </li>
            <li>Saia e entre novamente no app</li>
            <li>Retorne a <code className="font-mono text-sm">/dashboard/admins</code></li>
          </ol>
        </Card>
      </div>
    </Layout>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/layout'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { Charts } from '@/components/dashboard/charts'
import { DemandasTable } from '@/components/dashboard/demandas-table'
import { Button } from '@/components/ui/button'
import { LogOut, Shield } from 'lucide-react'
import { DashboardStats, Demanda } from '@/lib/types'
import { apiService } from '@/lib/api'
import { useAuth } from '@/components/auth/auth-provider'

export default function DashboardPage() {
  const { user, isAdmin, signOut } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user && isAdmin) {
      carregarDados()
    }
  }, [user, isAdmin])

  const carregarDados = async () => {
    try {
      setIsLoading(true)
      const [statsData, demandasData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getDemandas({ limit: 100 })
      ])
      
      setStats(statsData)
      setDemandas(demandasData)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (demandaId: string, novoStatus: 'aberta' | 'em_andamento' | 'resolvida') => {
    try {
      await apiService.updateDemandaStatus(demandaId, novoStatus)
      
      // Atualizar a demanda na lista local
      setDemandas(prev => prev.map(demanda => 
        demanda.id === demandaId 
          ? { ...demanda, status: novoStatus, data_resolucao: novoStatus === 'resolvida' ? new Date().toISOString() : demanda.data_resolucao }
          : demanda
      ))
      
      // Recarregar estatísticas
      const newStats = await apiService.getDashboardStats()
      setStats(newStats)
      
    } catch (error) {
      console.error('Erro ao atualizar status da demanda:', error)
      alert('Erro ao atualizar status da demanda')
    }
  }

  // Verificar se o usuário é admin
  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600 mb-6">Você precisa fazer login para acessar o dashboard administrativo.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Fazer Login
          </Button>
        </div>
      </Layout>
    )
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar o dashboard administrativo.</p>
          <Button onClick={() => window.location.href = '/'}>
            Voltar ao Início
          </Button>
        </div>
      </Layout>
    )
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando dashboard...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600">Bem-vindo, {user.email}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Estatísticas */}
        {stats && <StatsCards stats={stats} />}

        {/* Gráficos */}
        {stats && <Charts stats={stats} />}

        {/* Tabela de Demandas */}
        <DemandasTable 
          demandas={demandas}
          onStatusChange={handleStatusChange}
        />
      </div>
    </Layout>
  )
}

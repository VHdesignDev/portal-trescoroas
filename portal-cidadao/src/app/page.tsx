'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/layout'
import { DemandaCard } from '@/components/demanda-card'
import { DynamicMap } from '@/components/map/dynamic-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, MapPin, Filter, Eye, BarChart3 } from 'lucide-react'
import { Demanda } from '@/lib/types'
import { apiService } from '@/lib/api'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'


export default function Home() {
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [filtro, setFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('todas')
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  const { isAdmin, isDev } = useAuth()

  useEffect(() => {
    carregarDemandas()
  }, [])

  const carregarDemandas = async () => {
    try {
      setIsLoading(true)
      const data = await apiService.getDemandas({ limit: 50 })
      setDemandas(data)
    } catch (error) {
      console.error('Erro ao carregar demandas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const demandasFiltradas = demandas.filter(demanda => {
    const matchTexto = demanda.categoria.toLowerCase().includes(filtro.toLowerCase()) ||
                      (demanda.descricao?.toLowerCase().includes(filtro.toLowerCase()) ?? false)

    const matchStatus = statusFiltro === 'todas' || demanda.status === statusFiltro

    return matchTexto && matchStatus
  })

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Portal do Cidadão
          </h1>
          <h2 className="text-lg text-blue-600 font-semibold">
            Três Coroas - Rio Grande do Sul
          </h2>
          <p className="text-xl text-gray-800 max-w-2xl mx-auto font-medium">
            Ajude a melhorar nossa cidade reportando problemas e acompanhando soluções
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/nova-demanda">
              <Button size="lg" className="text-lg px-8 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Reportar Problema
              </Button>
            </Link>
            <Link href="/acompanhar">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                <Eye className="w-5 h-5 mr-2" />
                Acompanhar Demandas
              </Button>
            </Link>
            {(isAdmin || isDev) && (
              <Link href="/demandas">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Painel de Demandas
                </Button>
              </Link>
            )}
          </div>
        </div>
        {/* Filtros e Controles */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Demandas da Comunidade</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Lista
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Mapa
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por categoria ou descrição..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todos os Status</option>
                <option value="aberta">Abertas</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="resolvida">Resolvidas</option>
              </select>
            </div>

            {/* Conteúdo */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-800 font-medium">Carregando demandas...</p>
              </div>
            ) : viewMode === 'map' ? (
              <DynamicMap
                demandas={demandasFiltradas}
                height="600px"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demandasFiltradas.map((demanda) => (
                  <DemandaCard key={demanda.id} demanda={demanda} />
                ))}
              </div>
            )}

            {!isLoading && demandasFiltradas.length === 0 && (
              <div className="text-center py-8 text-gray-700">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">Nenhuma demanda encontrada com os filtros aplicados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

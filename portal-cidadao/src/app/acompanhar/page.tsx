'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DemandaCard } from '@/components/demanda-card'
import { DynamicMap } from '@/components/map/dynamic-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Card } from '@/components/ui/card'
import { apiService } from '@/lib/api'
import { Demanda } from '@/lib/types'
import { Search, MapPin, List, Filter, Eye, ArrowLeft } from 'lucide-react'

export default function AcompanharPage() {
  const router = useRouter()

  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [demandasFiltradas, setDemandasFiltradas] = useState<Demanda[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [busca, setBusca] = useState('')
  const [demandaSelecionada, setDemandaSelecionada] = useState<Demanda | null>(null)

  useEffect(() => {
    carregarDemandas()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [demandas, filtroStatus, filtroCategoria, busca])

  const carregarDemandas = async () => {
    try {
      setIsLoading(true)
      const data = await apiService.getDemandas()
      setDemandas(data)
    } catch (error) {
      console.error('Erro ao carregar demandas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let filtradas = demandas

    if (filtroStatus !== 'todos') {
      filtradas = filtradas.filter(d => d.status === filtroStatus)
    }

    if (filtroCategoria !== 'todas') {
      filtradas = filtradas.filter(d => d.categoria === filtroCategoria)
    }

    if (busca) {
      filtradas = filtradas.filter(d =>
        d.categoria.toLowerCase().includes(busca.toLowerCase()) ||
        d.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
        d.endereco?.toLowerCase().includes(busca.toLowerCase())
      )
    }

    setDemandasFiltradas(filtradas)
  }

  const categorias = [...new Set(demandas.map(d => d.categoria))]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta': return 'text-red-600 bg-red-50'
      case 'em_andamento': return 'text-yellow-600 bg-yellow-50'
      case 'resolvida': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberta': return 'Aberta'
      case 'em_andamento': return 'Em Andamento'
      case 'resolvida': return 'Resolvida'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a página inicial
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Acompanhar Demandas
          </h1>
          <p className="text-lg text-gray-800 max-w-2xl mx-auto font-medium">
            Acompanhe o status das demandas reportadas pela comunidade
          </p>
        </div>

        {/* Filtros */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por categoria, descrição ou endereço..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value="todos">Todos os Status</option>
                <option value="aberta">Abertas</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="resolvida">Resolvidas</option>
              </select>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value="todas">Todas as Categorias</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 hidden sm:inline">Exibir:</span>
                <div className="inline-flex rounded-lg shadow-sm border overflow-hidden bg-white">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none px-3 sm:px-4"
                    title="Ver em lista"
                    aria-label="Ver em lista"
                  >
                    <List className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Lista</span>
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="rounded-none px-3 sm:px-4"
                    title="Ver no mapa"
                    aria-label="Ver no mapa"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Mapa</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {demandasFiltradas.length}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {demandasFiltradas.filter(d => d.status === 'aberta').length}
              </div>
              <div className="text-sm text-gray-600">Abertas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {demandasFiltradas.filter(d => d.status === 'em_andamento').length}
              </div>
              <div className="text-sm text-gray-600">Em Andamento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {demandasFiltradas.filter(d => d.status === 'resolvida').length}
              </div>
              <div className="text-sm text-gray-600">Resolvidas</div>
            </div>
          </div>
        </Card>

        {/* Conteúdo */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-800 font-medium">Carregando demandas...</p>
            </div>
          ) : viewMode === 'map' ? (
            <DynamicMap
              demandas={demandasFiltradas}
              height="600px"
              onDemandaSelect={setDemandaSelecionada}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {demandasFiltradas.map((demanda) => (
                <DemandaCard key={demanda.id} demanda={demanda} />
              ))}
            </div>
          )}

          {!isLoading && demandasFiltradas.length === 0 && (
            <div className="text-center py-8 text-gray-700">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">Nenhuma demanda encontrada com os filtros aplicados.</p>
            </div>
          )}
        </div>

        {/* Modal de Demanda Selecionada */}
        {demandaSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Detalhes da Demanda
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDemandaSelecionada(null)}
                  >
                    ×
                  </Button>
                </div>
                <DemandaCard demanda={demandaSelecionada} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

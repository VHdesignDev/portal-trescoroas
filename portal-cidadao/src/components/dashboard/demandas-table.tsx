'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Demanda } from '@/lib/types'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'

interface DemandasTableProps {
  demandas: Demanda[]
  onStatusChange?: (demandaId: string, novoStatus: 'aberta' | 'em_andamento' | 'resolvida') => void
  onViewDetails?: (demanda: Demanda) => void
}

export function DemandasTable({ demandas, onStatusChange, onViewDetails }: DemandasTableProps) {
  const [filtro, setFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string>('todos')

  // Filtrar demandas
  const demandasFiltradas = demandas.filter(demanda => {
    const matchTexto = demanda.categoria.toLowerCase().includes(filtro.toLowerCase()) ||
                      (demanda.descricao?.toLowerCase().includes(filtro.toLowerCase()) ?? false)
    
    const matchStatus = statusFiltro === 'todos' || demanda.status === statusFiltro

    return matchTexto && matchStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberta':
        return <AlertCircle className="w-4 h-4" />
      case 'em_andamento':
        return <Clock className="w-4 h-4" />
      case 'resolvida':
        return <CheckCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Demandas</CardTitle>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
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
            <option value="todos">Todos os Status</option>
            <option value="aberta">Abertas</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="resolvida">Resolvidas</option>
          </select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Categoria</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Data Criação</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Localização</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {demandasFiltradas.map((demanda) => (
                <tr key={demanda.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{demanda.categoria}</div>
                      {demanda.descricao && (
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {demanda.descricao}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(demanda.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(demanda.status)}
                        <span>{getStatusText(demanda.status)}</span>
                      </div>
                    </Badge>
                  </td>
                  
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(demanda.data_criacao)}
                  </td>
                  
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {demanda.endereco ||
                     `${demanda.localizacao.lat.toFixed(4)}, ${demanda.localizacao.lng.toFixed(4)}`}
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {onViewDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(demanda)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {onStatusChange && demanda.status !== 'resolvida' && (
                        <div className="flex space-x-1">
                          {demanda.status === 'aberta' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onStatusChange(demanda.id, 'em_andamento')}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStatusChange(demanda.id, 'resolvida')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {demandasFiltradas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma demanda encontrada com os filtros aplicados.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

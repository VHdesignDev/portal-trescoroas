'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Clock } from 'lucide-react'
import { Demanda } from '@/lib/types'
import { formatDate, getStatusColor, getStatusText, calculateDaysAgo } from '@/lib/utils'

interface DemandaCardProps {
  demanda: Demanda
  onClick?: () => void
}

export function DemandaCard({ demanda, onClick }: DemandaCardProps) {
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${onClick ? 'hover:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {demanda.categoria}
          </CardTitle>
          <Badge className={getStatusColor(demanda.status)}>
            {getStatusText(demanda.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Foto */}
        {demanda.foto_url && (
          <div className="relative h-48 w-full rounded-lg overflow-hidden">
            <Image
              src={demanda.foto_url}
              alt="Foto da demanda"
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Descrição */}
        {demanda.descricao && (
          <p className="text-gray-700 text-sm line-clamp-3">
            {demanda.descricao}
          </p>
        )}

        {/* Localização */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          <span>
            {demanda.endereco ||
             `${demanda.localizacao.lat.toFixed(6)}, ${demanda.localizacao.lng.toFixed(6)}`}
          </span>
        </div>

        {/* Datas */}
        <div className="flex flex-col space-y-1 text-xs text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Criada: {formatDate(demanda.data_criacao)}</span>
          </div>
          
          {demanda.data_resolucao && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>Resolvida: {formatDate(demanda.data_resolucao)}</span>
            </div>
          )}
          
          {!demanda.data_resolucao && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{calculateDaysAgo(demanda.data_criacao)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

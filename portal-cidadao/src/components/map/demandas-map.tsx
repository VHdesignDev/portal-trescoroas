'use client'

import { useState, useEffect } from 'react'
import { LeafletMap } from './leaflet-map'
import { Demanda } from '@/lib/types'
import { getStatusText, formatDate } from '@/lib/utils'

interface DemandasMapProps {
  demandas: Demanda[]
  onDemandaSelect?: (demanda: Demanda) => void
  center?: [number, number]
  zoom?: number
  height?: string
}

export function DemandasMap({
  demandas,
  onDemandaSelect,
  center,
  zoom = 13,
  height = '500px',
}: DemandasMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    center || [-29.5108, -50.7750] // Três Coroas/RS
  )

  // Calcular centro baseado nas demandas se não foi fornecido
  useEffect(() => {
    if (!center && demandas.length > 0) {
      const lats = demandas.map(d => d.localizacao.lat)
      const lngs = demandas.map(d => d.localizacao.lng)
      
      const avgLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length
      const avgLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length
      
      setMapCenter([avgLat, avgLng])
    }
  }, [demandas, center])

  // Converter demandas para marcadores
  const markers = demandas.map(demanda => ({
    lat: demanda.localizacao.lat,
    lng: demanda.localizacao.lng,
    popup: `
      <div class="p-2 min-w-[200px]">
        <h3 class="font-semibold text-lg mb-2">${demanda.categoria}</h3>
        <div class="space-y-1 text-sm">
          <div class="flex items-center">
            <span class="inline-block w-2 h-2 rounded-full mr-2 ${
              demanda.status === 'aberta' ? 'bg-red-500' :
              demanda.status === 'em_andamento' ? 'bg-yellow-500' :
              'bg-green-500'
            }"></span>
            <span>${getStatusText(demanda.status)}</span>
          </div>
          ${demanda.descricao ? `<p class="text-gray-600 mt-2">${demanda.descricao}</p>` : ''}
          <p class="text-gray-500 text-xs mt-2">
            Criada em: ${formatDate(demanda.data_criacao)}
          </p>
          ${demanda.data_resolucao ? 
            `<p class="text-gray-500 text-xs">
              Resolvida em: ${formatDate(demanda.data_resolucao)}
            </p>` : ''
          }
        </div>
        ${onDemandaSelect ? 
          `<button 
            onclick="window.selectDemanda('${demanda.id}')"
            class="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Ver Detalhes
          </button>` : ''
        }
      </div>
    `,
    color: demanda.status === 'aberta' ? 'red' :
           demanda.status === 'em_andamento' ? 'yellow' : 'green'
  }))

  // Configurar callback global para seleção de demanda
  useEffect(() => {
    if (typeof window !== 'undefined' && onDemandaSelect) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).selectDemanda = (demandaId: string) => {
        const demanda = demandas.find(d => d.id === demandaId)
        if (demanda) {
          onDemandaSelect(demanda)
        }
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).selectDemanda
      }
    }
  }, [demandas, onDemandaSelect])

  return (
    <div className="w-full">
      <LeafletMap
        center={mapCenter}
        zoom={zoom}
        markers={markers}
        height={height}
        className="shadow-md"
      />
      
      {/* Legenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Abertas</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span>Em Andamento</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Resolvidas</span>
        </div>
      </div>
    </div>
  )
}

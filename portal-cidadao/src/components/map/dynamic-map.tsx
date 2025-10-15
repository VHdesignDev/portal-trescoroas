'use client'

import dynamic from 'next/dynamic'
import { Demanda } from '@/lib/types'

// Importar o mapa dinamicamente para evitar problemas de SSR
const DemandasMapComponent = dynamic(
  () => import('./demandas-map').then(mod => ({ default: mod.DemandasMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    )
  }
)

interface DynamicMapProps {
  demandas: Demanda[]
  onDemandaSelect?: (demanda: Demanda) => void
  center?: [number, number]
  zoom?: number
  height?: string
}

export function DynamicMap(props: DynamicMapProps) {
  return <DemandasMapComponent {...props} />
}

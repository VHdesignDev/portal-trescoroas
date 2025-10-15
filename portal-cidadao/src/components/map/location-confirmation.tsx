'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { geocodingService, GeocodingResult } from '@/lib/geocoding'
import { MapPin, Check, X, RefreshCw } from 'lucide-react'

// CSS do Leaflet (seguro importar em Client Component)
import 'leaflet/dist/leaflet.css'

import type { Map as LeafletMap } from 'leaflet'

// Importar o mapa dinamicamente para evitar problemas de SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
)

interface LocationConfirmationProps {
  location: { lat: number; lng: number }
  onConfirm: (location: { lat: number; lng: number }, address: string, neighborhood?: string) => void
  onCancel: () => void
  onRetry: () => void
}

export function LocationConfirmation({
  location,
  onConfirm,
  onCancel,
  onRetry
}: LocationConfirmationProps) {
  const [address, setAddress] = useState<string>('')
  const [neighborhood, setNeighborhood] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const [position, setPosition] = useState<{ lat: number; lng: number }>({ lat: location.lat, lng: location.lng })
  const mapRef = useRef<LeafletMap | null>(null)

  // Reposiciona quando as props mudarem
  useEffect(() => {
    setPosition({ lat: location.lat, lng: location.lng })
  }, [location.lat, location.lng])

  // Leaflet: carregar dinamicamente no cliente e ajustar ícones
  const [leafletReady, setLeafletReady] = useState(false)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (typeof window === 'undefined') return
      const L = await import('leaflet')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })
      if (mounted) setLeafletReady(true)
    })()
    return () => { mounted = false }
  }, [])

  // Recarrega o endereço quando a posição mudar
  useEffect(() => {
    loadAddress({ lat: position.lat, lng: position.lng })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.lat, position.lng])

  const loadAddress = async (pos?: { lat: number; lng: number }) => {
    const target = pos ?? position
    try {
      setIsLoading(true)
      setError('')

      const result = await geocodingService.reverseGeocode(target.lat, target.lng)

      if (result) {
        setAddress(geocodingService.formatAddress(result))
        setNeighborhood(geocodingService.extractNeighborhood(result) || '')
      } else {
        setError('Não foi possível obter o endereço desta localização')
        setAddress(`Lat: ${target.lat.toFixed(6)}, Lng: ${target.lng.toFixed(6)}`)
      }
    } catch (error) {
      console.error('Erro ao carregar endereço:', error)
      setError('Erro ao carregar endereço')
      setAddress(`Lat: ${target.lat.toFixed(6)}, Lng: ${target.lng.toFixed(6)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = () => {
    onConfirm({ lat: position.lat, lng: position.lng }, address, neighborhood)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar Localização
            </h3>
            <p className="text-sm text-gray-600">
              Arraste o marcador ou clique no mapa para ajustar a localização. Depois, confirme.
            </p>
          </div>

          {/* Mapa */}
          <div className="h-64 w-full rounded-lg overflow-hidden border-2 border-gray-200 mb-4">
            {leafletReady && (
              <MapContainer
                ref={mapRef as any}
                center={[position.lat, position.lng]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                whenReady={() => {
                  // Garante layout correto ao abrir modal
                  setTimeout(() => { try { mapRef.current?.invalidateSize(); } catch {} }, 0)
                }}
                // Captura cliques no mapa para atualizar posição
                onclick={(ev: any) => {
                  const { lat, lng } = ev.latlng
                  setPosition({ lat, lng })
                }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker
                  position={[position.lat, position.lng]}
                  draggable
                  eventHandlers={{
                    dragend: (e: any) => {
                      const latlng = e.target.getLatLng()
                      setPosition({ lat: latlng.lat, lng: latlng.lng })
                    },
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <MapPin className="w-4 h-4 mx-auto mb-1 text-red-500" />
                      <p className="text-sm font-medium">Localização da Demanda</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            )}
          </div>

          {/* Informações do Endereço */}
          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Endereço Detectado:
              </label>
              {isLoading ? (
                <div className="flex items-center text-gray-600">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Carregando endereço...
                </div>
              ) : error ? (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-800 font-medium">{address}</p>
                  {neighborhood && (
                    <p className="text-sm text-gray-600 mt-1">
                      Bairro: {neighborhood}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500">
              <p>Coordenadas: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>

            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>

            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={isLoading}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar Localização
            </Button>
          </div>

          {!error && !isLoading && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <MapPin className="w-4 h-4 inline mr-1" />
                Você pode arrastar o marcador ou clicar no mapa para ajustar o ponto. Depois, clique em Confirmar Localização.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

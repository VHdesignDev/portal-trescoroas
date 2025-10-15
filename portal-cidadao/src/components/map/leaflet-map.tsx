'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  onLocationSelect?: (lat: number, lng: number) => void
  markers?: Array<{
    lat: number
    lng: number
    popup?: string
    color?: string
  }>
  height?: string
  className?: string
}

export function LeafletMap({
  center = [-23.5505, -46.6333], // São Paulo como padrão
  zoom = 13,
  onLocationSelect,
  markers = [],
  height = '400px',
  className = '',
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Inicializar o mapa
    const map = L.map(mapRef.current).setView(center, zoom)

    // Adicionar camada do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    // Adicionar evento de clique se onLocationSelect foi fornecido
    if (onLocationSelect) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        onLocationSelect(lat, lng)
      })
    }

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [center, zoom, onLocationSelect])

  // Atualizar marcadores quando a prop markers mudar
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Remover marcadores existentes
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    // Adicionar novos marcadores
    markers.forEach(markerData => {
      if (!mapInstanceRef.current) return

      const marker = L.marker([markerData.lat, markerData.lng])
      
      if (markerData.popup) {
        marker.bindPopup(markerData.popup)
      }

      marker.addTo(mapInstanceRef.current)
      markersRef.current.push(marker)
    })

    // Ajustar visualização se houver marcadores
    if (markers.length > 0) {
      const group = new L.FeatureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [markers])

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className={`w-full rounded-lg border ${className}`}
    />
  )
}

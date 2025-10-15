// Serviço de Geocoding usando Nominatim (OpenStreetMap) - Gratuito
export interface GeocodingResult {
  address: string
  neighborhood?: string
  city?: string
  state?: string
  country?: string
  postcode?: string
}

export class GeocodingService {
  // Usa proxy de API interno para evitar CORS com Nominatim
  private baseUrl = '/api/geocode'

  // Geocoding reverso: obter endereço a partir de coordenadas
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reverse?lat=${lat}&lon=${lng}&zoom=18&lang=pt-BR`,
        { cache: 'no-store' }
      )

      if (!response.ok) {
        throw new Error('Erro na requisição de geocoding')
      }

      const data = await response.json()

      if (!data || !data.display_name) {
        return null
      }

      // Extrair informações do endereço
      const address = data.address || {}
      
      return {
        address: data.display_name,
        neighborhood: address.neighbourhood || address.suburb || address.quarter,
        city: address.city || address.town || address.village || address.municipality,
        state: address.state,
        country: address.country,
        postcode: address.postcode
      }
    } catch (error) {
      console.error('Erro no geocoding reverso:', error)
      return null
    }
  }

  // Geocoding direto: obter coordenadas a partir de endereço
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(address)}&limit=1&lang=pt-BR`,
        { cache: 'no-store' }
      )

      if (!response.ok) {
        throw new Error('Erro na requisição de geocoding')
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        return null
      }

      const result = data[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      }
    } catch (error) {
      console.error('Erro no geocoding:', error)
      return null
    }
  }

  // Buscar endereços com sugestões
  async searchAddresses(query: string, limit: number = 5): Promise<GeocodingResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}&lang=pt-BR`,
        { cache: 'no-store' }
      )

      if (!response.ok) {
        throw new Error('Erro na requisição de busca')
      }

      const data = await response.json()

      type NominatimItem = {
        display_name: string
        address?: Record<string, string>
      }

      return (data as NominatimItem[]).map((item) => {
        const address = item.address || {}
        return {
          address: item.display_name,
          neighborhood: address.neighbourhood || address.suburb || address.quarter,
          city: address.city || address.town || address.village || address.municipality,
          state: address.state,
          country: address.country,
          postcode: address.postcode
        }
      })
    } catch (error) {
      console.error('Erro na busca de endereços:', error)
      return []
    }
  }

  // Extrair bairro do resultado de geocoding
  extractNeighborhood(result: GeocodingResult): string | null {
    return result.neighborhood || null
  }

  // Formatar endereço de forma mais limpa
  formatAddress(result: GeocodingResult): string {
    const parts = result.address.split(',')
    
    // Tentar extrair apenas a parte mais relevante (rua e número)
    if (parts.length > 2) {
      return parts.slice(0, 2).join(',').trim()
    }
    
    return result.address
  }
}

export const geocodingService = new GeocodingService()

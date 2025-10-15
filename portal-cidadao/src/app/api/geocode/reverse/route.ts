import { NextResponse } from 'next/server'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const zoom = searchParams.get('zoom') ?? '18'
    const lang = searchParams.get('lang') ?? 'pt-BR'

    if (!lat || !lon) {
      return NextResponse.json({ error: 'lat e lon são obrigatórios' }, { status: 400 })
    }

    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=${encodeURIComponent(zoom)}&addressdetails=1&accept-language=${encodeURIComponent(lang)}`

    const resp = await fetch(url, {
      // Importante: cabeçalho User-Agent conforme política do Nominatim
      headers: {
        'User-Agent': process.env.NOMINATIM_USER_AGENT || 'Portal-Cidadao/1.0 (+localhost; dev)'
      },
      // Evita cache agressivo durante desenvolvimento
      cache: 'no-store'
    })

    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json({ error: 'Erro Nominatim', status: resp.status, body: text }, { status: 502 })
    }

    const data = await resp.json()
    return NextResponse.json(data, {
      headers: {
        // Opcional: permitir consumir de outras origens se necessário
        // 'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (err: unknown) {
    console.error('Erro no proxy reverse geocode:', err)
    return NextResponse.json({ error: 'Erro interno no proxy de geocoding' }, { status: 500 })
  }
}


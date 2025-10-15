import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'file ausente' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `demandas/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const supabase = createSupabaseAdmin()
    // Garante que o bucket exista e seja publico (idempotente)
    await supabase.storage.createBucket('fotos', { public: true }).catch(() => {})

    const { error: uploadError } = await supabase.storage
      .from('fotos')
      .upload(path, buffer, { contentType: file.type })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = supabase.storage.from('fotos').getPublicUrl(path)

    return NextResponse.json({ path, publicUrl: data.publicUrl })
  } catch (e: any) {
    console.error('Erro no upload-foto API:', e)
    return NextResponse.json({ error: 'erro interno no upload' }, { status: 500 })
  }
}


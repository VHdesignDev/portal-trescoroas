import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

// Helper to create a server-side Supabase client bound to incoming cookies (current user)
async function createSupabaseServer() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      // API route não precisa set/remove cookies no fluxo atual
      set() {},
      remove() {},
    },
  })
}

function extractFotoPath(publicUrl?: string | null): string | null {
  if (!publicUrl) return null
  const marker = '/storage/v1/object/public/fotos/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length)
}

export async function POST(req: Request) {
  try {
    const server = await createSupabaseServer()
    const admin = createSupabaseAdmin()

    // 1) Autenticação + autorização (apenas DEV)
    const { data: userData, error: userErr } = await server.auth.getUser()
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const { data: isDev } = await server.rpc('is_dev')
    if (!isDev) {
      return NextResponse.json({ error: 'Acesso negado: somente DEV' }, { status: 403 })
    }

    // 2) Ler filtros
    const body = await req.json().catch(() => ({}))
    const {
      dryRun = true,
      email, // string (ilike)
      descricao, // string (ilike)
      status, // string[]
      dataInicial, // ISO string
      dataFinal, // ISO string
    }: {
      dryRun?: boolean
      email?: string
      descricao?: string
      status?: string[]
      dataInicial?: string
      dataFinal?: string
    } = body || {}

    // 3) Se filtrar por email, buscar user_ids primeiro
    let userIds: string[] | null = null
    if (email && email.trim()) {
      const { data: users, error: uErr } = await admin
        .from('auth.users')
        .select('id,email')
        .ilike('email', `%${email.trim()}%`)
      if (uErr) {
        return NextResponse.json({ error: uErr.message }, { status: 500 })
      }
      userIds = (users || []).map((u: any) => u.id)
      if (userIds.length === 0) {
        return NextResponse.json({ ok: true, dryRun, count: 0, sample: [] })
      }
    }

    // 4) Montar query de demandas
    const baseSelect = admin.from('demandas').select('id, foto_url', { count: 'exact' })
    let query = baseSelect
    if (userIds) query = query.in('user_id', userIds)
    if (descricao && descricao.trim()) query = query.ilike('descricao', `%${descricao.trim()}%`)
    if (Array.isArray(status) && status.length) query = query.in('status', status)
    if (dataInicial) query = query.gte('data_criacao', dataInicial)
    if (dataFinal) query = query.lte('data_criacao', dataFinal)

    if (dryRun) {
      const { data: rows, count, error } = await query.limit(50)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, dryRun: true, count: count || 0, sample: rows || [] })
    }

    // Execução: coletar todos os ids (em lotes), apagar fotos e registros
    const pageSize = 1000
    let from = 0
    let totalDeleted = 0
    let allIds: string[] = []
    let allFotoPaths: string[] = []

    while (true) {
      const { data: rows, error } = await query.range(from, from + pageSize - 1)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const batch = rows || []
      if (batch.length === 0) break
      allIds.push(...batch.map((r: any) => r.id))
      const paths = batch
        .map((r: any) => extractFotoPath(r.foto_url))
        .filter((p: string | null): p is string => Boolean(p))
      allFotoPaths.push(...paths)
      if (batch.length < pageSize) break
      from += pageSize
    }

    if (allIds.length === 0) {
      return NextResponse.json({ ok: true, dryRun: false, deleted: 0, removedPhotos: 0 })
    }

    // 5) Remover fotos (em lotes para evitar payloads grandes)
    let removedPhotos = 0
    const chunk = 1000
    for (let i = 0; i < allFotoPaths.length; i += chunk) {
      const slice = allFotoPaths.slice(i, i + chunk)
      if (slice.length === 0) continue
      const { error: remErr } = await admin.storage.from('fotos').remove(slice)
      if (remErr) {
        // Não aborta a operação; registra e segue
        console.warn('[purge-demandas] Erro removendo fotos:', remErr.message)
      } else {
        removedPhotos += slice.length
      }
    }

    // 6) Remover registros (em lotes)
    for (let i = 0; i < allIds.length; i += 1000) {
      const slice = allIds.slice(i, i + 1000)
      const { error: delErr, count } = await admin
        .from('demandas')
        .delete({ count: 'exact' })
        .in('id', slice)
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
      totalDeleted += count || 0
    }

    return NextResponse.json({ ok: true, dryRun: false, deleted: totalDeleted, removedPhotos })
  } catch (e: any) {
    console.error('[purge-demandas] Unexpected error', e)
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}


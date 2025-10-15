import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface DemandaPayload {
  id?: string
  categoria?: string
  descricao?: string
  endereco?: string | null
  bairro?: string | null
  foto_url?: string | null
  localizacao?: { lat: number; lng: number }
  status?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { type?: string; demanda?: DemandaPayload }
    const demanda = body?.demanda

    const recipients = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    if (!recipients.length) {
      // Sem destinatários configurados, não falhar o fluxo
      return NextResponse.json({ ok: true, skipped: 'no-admin-emails' })
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      // Sem provedor de e-mail configurado, sair em no-op
      return NextResponse.json({ ok: true, skipped: 'no-resend-api-key' })
    }

    const from = process.env.EMAIL_FROM || 'Portal Cidadão <no-reply@localhost>'
    const subject = body?.type === 'nova_demanda'
      ? 'Nova demanda registrada no Portal Cidadão'
      : 'Notificação do Portal Cidadão'

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>${subject}</h2>
        ${demanda ? `
        <p><strong>Categoria:</strong> ${demanda.categoria || '-'}<br/>
           <strong>Status:</strong> ${demanda.status || '-'}<br/>
           <strong>Bairro:</strong> ${demanda.bairro || '-'}<br/>
           <strong>Endereço:</strong> ${demanda.endereco || '-'}
        </p>
        <p>${demanda.descricao || ''}</p>
        ${demanda.foto_url ? `<p><img src="${demanda.foto_url}" alt="Foto" width="480"/></p>` : ''}
        ` : ''}
        <p><a href="${process.env.APP_BASE_URL || 'http://localhost:3000'}/dashboard" target="_blank">Abrir painel administrativo</a></p>
      </div>
    `

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        html,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('Falha ao enviar e-mail (Resend):', text)
      return NextResponse.json({ ok: false, error: 'email-failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Erro em /api/notify-admin:', e)
    return NextResponse.json({ ok: false, error: 'internal-error' }, { status: 500 })
  }
}


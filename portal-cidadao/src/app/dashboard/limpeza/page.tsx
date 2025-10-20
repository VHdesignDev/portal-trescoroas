"use client"

import { useState } from 'react'
import { useRequireDev } from '@/components/auth/auth-provider'

type PurgeFilters = {
  email?: string
  descricao?: string
  status?: string[]
  dataInicial?: string // ISO yyyy-mm-dd
  dataFinal?: string // ISO yyyy-mm-dd
}

type DryRunResult = {
  ok: true
  dryRun: true
  count: number
  sample: Array<{ id: string; foto_url: string | null }>
}

type ExecResult = {
  ok: true
  dryRun: false
  deleted: number
  removedPhotos: number
}

type ApiError = { error: string }

const ALL_STATUSES = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'resolvida', label: 'Resolvida' },
]

export default function LimpezaPage() {
  const { isLoading } = useRequireDev('/')
  const [filters, setFilters] = useState<PurgeFilters>({})
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [loading, setLoading] = useState<'idle' | 'count' | 'delete'>('idle')
  const [result, setResult] = useState<DryRunResult | ExecResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateFilter = (key: keyof PurgeFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleStatus = (value: string) => {
    setSelectedStatuses((prev) => {
      const exists = prev.includes(value)
      const next = exists ? prev.filter((v) => v !== value) : [...prev, value]
      updateFilter('status', next.length ? next : undefined)
      return next
    })
  }

  const runCount = async () => {
    setLoading('count')
    setError(null)
    setResult(null)
    try {
      const payload = {
        dryRun: true,
        ...filters,
      }
      const resp = await fetch('/api/admin/purge-demandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await resp.json()) as DryRunResult | ApiError
      if (!resp.ok || (data as ApiError).error) throw new Error((data as ApiError).error || 'Falha ao contar')
      setResult(data as DryRunResult)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading('idle')
    }
  }

  const runDelete = async () => {
    if (!result || (result as DryRunResult).dryRun !== true) {
      if (!confirm('Tem certeza que deseja prosseguir sem contar antes?')) return
    }
    const amount = (result && (result as DryRunResult).count) || 0
    if (!confirm(`Confirmar exclusão de ${amount} demanda(s)? Esta ação não pode ser desfeita.`)) return

    setLoading('delete')
    setError(null)
    try {
      const payload = {
        dryRun: false,
        ...filters,
      }
      const resp = await fetch('/api/admin/purge-demandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await resp.json()) as ExecResult | ApiError
      if (!resp.ok || (data as ApiError).error) throw new Error((data as ApiError).error || 'Falha ao apagar')
      setResult(data as ExecResult)
      alert(`Exclusão concluída: ${(data as ExecResult).deleted} demandas, ${(data as ExecResult).removedPhotos} foto(s) removida(s).`)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading('idle')
    }
  }

  if (isLoading) return null

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Limpeza de Demandas (DEV)</h1>

      <div className="space-y-4 p-4 border rounded-md">
        <div>
          <label className="block text-sm font-medium">E-mail do autor (contém)</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="usuario@exemplo.com"
            value={filters.email || ''}
            onChange={(e) => updateFilter('email', e.target.value || undefined)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Descrição (contém)</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="ex.: teste"
            value={filters.descricao || ''}
            onChange={(e) => updateFilter('descricao', e.target.value || undefined)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <div className="flex gap-3 flex-wrap">
            {ALL_STATUSES.map((s) => (
              <label key={s.value} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(s.value)}
                  onChange={() => toggleStatus(s.value)}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Data inicial</label>
            <input
              type="date"
              className="mt-1 w-full border rounded px-3 py-2"
              value={filters.dataInicial || ''}
              onChange={(e) => updateFilter('dataInicial', e.target.value || undefined)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Data final</label>
            <input
              type="date"
              className="mt-1 w-full border rounded px-3 py-2"
              value={filters.dataFinal || ''}
              onChange={(e) => updateFilter('dataFinal', e.target.value || undefined)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runCount}
            disabled={loading !== 'idle'}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {loading === 'count' ? 'Contando…' : 'Contar'}
          </button>
          <button
            onClick={runDelete}
            disabled={loading !== 'idle'}
            className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
          >
            {loading === 'delete' ? 'Apagando…' : 'Apagar'}
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {result && (result as any).dryRun === true && (
          <div className="text-sm text-gray-700">
            <div>Prévia: {(result as DryRunResult).count} demanda(s) correspondem aos filtros.</div>
            {!!(result as DryRunResult).sample.length && (
              <div className="mt-1 text-gray-500">Mostrando até 50 itens na amostra.</div>
            )}
          </div>
        )}

        {result && (result as any).dryRun === false && (
          <div className="text-sm text-green-700">
            <div>Exclusão concluída.</div>
            <div>Demandas apagadas: {(result as ExecResult).deleted}</div>
            <div>Fotos removidas: {(result as ExecResult).removedPhotos}</div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Dica: comece usando descrição = "teste" e/ou seu e-mail para evitar apagar dados reais.
      </p>
    </div>
  )
}


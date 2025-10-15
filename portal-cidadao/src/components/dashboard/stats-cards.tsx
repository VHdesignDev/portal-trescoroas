'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Clock, CheckCircle, BarChart3 } from 'lucide-react'
import { DashboardStats } from '@/lib/types'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total de Demandas',
      value: stats.total_demandas,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Demandas Abertas',
      value: stats.demandas_abertas,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Em Andamento',
      value: stats.demandas_em_andamento,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Resolvidas',
      value: stats.demandas_resolvidas,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{card.value}</div>
              {card.title === 'Resolvidas' && stats.total_demandas > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.demandas_resolvidas / stats.total_demandas) * 100).toFixed(1)}% do total
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
      
      {/* Card de Tempo Médio de Resolução */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tempo Médio de Resolução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-card-foreground">
            {stats.tempo_medio_resolucao > 0
              ? `${stats.tempo_medio_resolucao.toFixed(1)} dias`
              : 'N/A'
            }
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Baseado em {stats.demandas_resolvidas} demandas resolvidas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

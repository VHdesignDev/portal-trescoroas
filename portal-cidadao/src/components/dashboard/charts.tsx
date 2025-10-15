'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { DashboardStats } from '@/lib/types'

interface ChartsProps {
  stats: DashboardStats
}



export function Charts({ stats }: ChartsProps) {
  // Preparar dados para o gráfico de categorias
  const categoriaData = stats.demandas_por_categoria?.slice(0, 6) || []

  // Preparar dados para o gráfico de evolução mensal
  const evolucaoData = stats.evolucao_mensal?.map(item => ({
    ...item,
    mes: new Date(item.mes + '-01').toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: '2-digit' 
    })
  })) || []

  // Dados para o gráfico de pizza (status)
  const statusData = [
    { name: 'Abertas', value: stats.demandas_abertas, color: '#EF4444' },
    { name: 'Em Andamento', value: stats.demandas_em_andamento, color: '#F59E0B' },
    { name: 'Resolvidas', value: stats.demandas_resolvidas, color: '#10B981' },
  ].filter(item => item.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Demandas por Categoria */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Demandas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoriaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="categoria" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="abertas" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Abertas"
              />
              <Line 
                type="monotone" 
                dataKey="resolvidas" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Resolvidas"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Status */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

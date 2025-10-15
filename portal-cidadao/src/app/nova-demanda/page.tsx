'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { NovaDemandaForm } from '@/components/forms/nova-demanda-form'
import { DemandaForm, Categoria } from '@/lib/types'
import { apiService } from '@/lib/api'
import { useEffect } from 'react'

export default function NovaDemandaPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    carregarCategorias()
  }, [])

  const carregarCategorias = async () => {
    try {
      const data = await apiService.getCategorias()
      setCategorias(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: DemandaForm) => {
    try {
      await apiService.createDemanda(data)
      
      // Mostrar mensagem de sucesso
      alert('Demanda criada com sucesso! Obrigado por contribuir para melhorar nossa cidade.')
      
      // Redirecionar para a página inicial
      router.push('/')
    } catch (error) {
      console.error('Erro ao criar demanda:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando formulário...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Reportar Novo Problema
          </h1>
          <p className="text-lg text-gray-600">
            Ajude a melhorar nossa cidade reportando problemas em sua região
          </p>
        </div>

        <NovaDemandaForm 
          onSubmit={handleSubmit}
          categorias={categorias}
        />
      </div>
    </Layout>
  )
}

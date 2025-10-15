'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Upload, MapPin, Loader2, Navigation } from 'lucide-react'
import { LocationConfirmation } from '@/components/map/location-confirmation'
import { DemandaForm } from '@/lib/types'
import Image from 'next/image'

const demandaSchema = z.object({
  categoria: z.string().min(1, 'Selecione uma categoria'),
  descricao: z.string().optional(),
  localizacao: z.object({
    lat: z.number(),
    lng: z.number(),
    endereco: z.string().optional(),
  }),
})

type DemandaFormData = z.infer<typeof demandaSchema>

interface NovaDemandaFormProps {
  onSubmit: (data: DemandaForm) => Promise<void>
  categorias: Array<{ id: string; nome: string; icone: string; cor: string }>
}

export function NovaDemandaForm({ onSubmit, categorias }: NovaDemandaFormProps) {
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [localizacao, setLocalizacao] = useState<{ lat: number; lng: number; endereco?: string } | null>(null)
  const [endereco, setEndereco] = useState<string>('')
  const [bairro, setBairro] = useState<string>('')
  const [showLocationConfirmation, setShowLocationConfirmation] = useState(false)
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null)

  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DemandaFormData>({
    resolver: zodResolver(demandaSchema),
  })

  const handleFotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.')
        return
      }

      // Validar tamanho (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. O tamanho máximo é 5MB.')
        return
      }

      setFoto(file)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setFotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const obterLocalizacaoAtual = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsGettingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const novaLocalizacao = { lat: latitude, lng: longitude }
          setPendingLocation(novaLocalizacao)
          setShowLocationConfirmation(true)
          setIsGettingLocation(false)
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
          alert('Não foi possível obter sua localização. Verifique as permissões do navegador.')
          setIsGettingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    } else {
      alert('Geolocalização não é suportada neste navegador.')
    }
  }

  const handleLocationConfirm = (location: { lat: number; lng: number }, address: string, neighborhood?: string) => {
    // guarda endereço junto às coordenadas para exibir no resumo
    const loc = { ...location, endereco: address }
    setLocalizacao(loc)
    setEndereco(address)
    setBairro(neighborhood || '')
    setValue('localizacao', loc)
    setShowLocationConfirmation(false)
    setPendingLocation(null)
  }

  const handleLocationCancel = () => {
    setShowLocationConfirmation(false)
    setPendingLocation(null)
  }

  const handleLocationRetry = () => {
    setShowLocationConfirmation(false)
    setPendingLocation(null)
    obterLocalizacaoAtual()
  }

  const onSubmitForm = async (data: DemandaFormData) => {
    if (!localizacao) {
      alert('Por favor, selecione uma localização.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        foto,
        categoria: data.categoria,
        descricao: data.descricao || '',
        localizacao: data.localizacao,
        endereco: endereco || undefined,
        bairro: bairro || undefined,
      })
    } catch (error) {
      console.error('Erro ao enviar demanda:', error)
      alert('Erro ao enviar demanda. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Nova Demanda</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Upload de Foto */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Foto (opcional)</label>
            <p className="text-xs text-gray-600">
              Formatos aceitos: JPEG, PNG, WebP, GIF (máx. 5MB)
            </p>
            <div className="flex flex-col space-y-4">
              {fotoPreview && (
                <div className="relative h-48 w-full rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={fotoPreview}
                    alt="Preview da foto"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 shadow-lg"
                    onClick={() => {
                      setFoto(null)
                      setFotoPreview(null)
                    }}
                  >
                    ✕
                  </Button>
                  {uploadProgress && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p>Enviando foto...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex space-x-2">
                {/* Inputs ocultos controlados por ref */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoChange}
                  className="hidden"
                />

                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Escolher da Galeria
                  </Button>
                </div>

                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Tirar Foto
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria *</label>
            <select
              {...register('categoria')}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="" disabled hidden>Selecione uma categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.nome}>
                  {categoria.nome}
                </option>
              ))}
            </select>
            {errors.categoria && (
              <p className="text-sm text-red-600">{errors.categoria.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Textarea
              {...register('descricao')}
              placeholder="Descreva o problema em detalhes..."
              rows={4}
            />
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Localização *</label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={obterLocalizacaoAtual}
                className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Obtendo localização...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 mr-2" />
                    Usar Minha Localização Atual
                  </>
                )}
              </Button>
              {localizacao && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    Localização selecionada: {localizacao.lat.toFixed(6)}, {localizacao.lng.toFixed(6)}
                  </p>
                  {(localizacao.endereco || endereco) && (
                    <p className="text-sm text-green-700 mt-1">Endereço: {localizacao.endereco || endereco}{bairro ? ` - ${bairro}` : ''}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botão de Envio */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !localizacao}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Demanda'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>

    {/* Modal de Confirmação de Localização */}
    {showLocationConfirmation && pendingLocation && (
      <LocationConfirmation
        location={pendingLocation}
        onConfirm={handleLocationConfirm}
        onCancel={handleLocationCancel}
        onRetry={handleLocationRetry}
      />
    )}
  </>
  )
}

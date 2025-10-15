import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'aberta':
      return 'bg-red-100 text-red-800'
    case 'em_andamento':
      return 'bg-yellow-100 text-yellow-800'
    case 'resolvida':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusText(status: string) {
  switch (status) {
    case 'aberta':
      return 'Aberta'
    case 'em_andamento':
      return 'Em Andamento'
    case 'resolvida':
      return 'Resolvida'
    default:
      return status
  }
}

export function calculateDaysAgo(date: string | Date) {
  const now = new Date()
  const targetDate = new Date(date)
  const diffTime = Math.abs(now.getTime() - targetDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '1 dia atrás'
  if (diffDays < 7) return `${diffDays} dias atrás`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`
  return `${Math.floor(diffDays / 365)} anos atrás`
}

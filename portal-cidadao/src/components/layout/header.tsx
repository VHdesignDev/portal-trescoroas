'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, MapPin, BarChart3, Plus, Users, LogIn, Home, Eye } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut, isAdmin, isDev } = useAuth()

  const navigation = [
    { name: 'Início', href: '/', icon: Home, public: true },
    { name: 'Reportar Problema', href: '/nova-demanda', icon: Plus, public: true },
    { name: 'Acompanhar Demandas', href: '/acompanhar', icon: Eye, public: true },
    { name: 'Demandas', href: '/demandas', icon: BarChart3, admin: true, dev: true },
    // Aba exclusiva de devs para gerenciar admins/devs
    { name: 'Administração', href: '/dashboard/admins', icon: Users, dev: true },
  ] as Array<{ name: string; href: string; icon: any; public?: boolean; admin?: boolean; dev?: boolean }>

  const filteredNavigation = navigation.filter(item =>
    item.public || (item.admin && isAdmin) || (item.dev && isDev)
  )

  const handleLogout = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Portal Cidadão</span>
                <span className="text-xs text-blue-600 font-medium">Três Coroas/RS</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-6">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-800 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-2 border-l pl-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="flex items-center text-sm text-gray-700 font-medium">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></span>
                    {user.name || user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-700"
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button size="sm" className="flex items-center space-x-1 bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                    <LogIn className="w-4 h-4" />
                    <span>Entrar</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center space-x-2">
            {user ? (
              <div className="flex items-center">
                <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                  {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  <span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                </span>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 h-9 px-3 flex items-center">
                  <LogIn className="w-4 h-4 mr-1" />
                  Entrar
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menu"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-white shadow-sm h-10 w-10 rounded-lg"
            >
              {isMenuOpen ? (
                <X className="h-7 w-7 text-blue-700" strokeWidth={2.5} />
              ) : (
                <Menu className="h-7 w-7 text-blue-700" strokeWidth={2.5} />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-800 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}

              {/* Mobile Auth Section */}
              <div className="border-t pt-2 mt-2">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-700 font-medium">
                      {user.name || user.email}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full justify-start text-gray-700"
                    >
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

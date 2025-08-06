"use client"

import { useState } from "react"
import { Menu, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface NavigationProps {
  currentPage?: "avisos" | "clientes" | "companias"
  onNavigate?: (page: "avisos" | "clientes" | "companias") => void
  onLogout?: () => void
}

export default function Navigation({ currentPage = "avisos", onNavigate, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationLinks = [
    { id: "avisos", label: "Avisos", href: "#" },
    { id: "clientes", label: "Clientes", href: "#" },
    { id: "companias", label: "Compañías", href: "#" },
  ] as const

  const handleNavigation = (page: "avisos" | "clientes" | "companias") => {
    onNavigate?.(page)
    setIsMobileMenuOpen(false) // Cerrar menú móvil al navegar
  }

  const getLinkClasses = (linkId: string) => {
    const baseClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
    const activeClasses = "bg-blue-100 text-blue-900 font-semibold"
    const inactiveClasses = "text-gray-600 hover:text-gray-900 hover:bg-gray-100"

    return `${baseClasses} ${currentPage === linkId ? activeClasses : inactiveClasses}`
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">GestorPólizas</h1>
          </div>

          {/* Navegación Desktop - Centro */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationLinks.map((link) => (
              <button key={link.id} onClick={() => handleNavigation(link.id)} className={getLinkClasses(link.id)}>
                {link.label}
              </button>
            ))}
          </nav>

          {/* Sección Derecha */}
          <div className="flex items-center">
            {/* Avatar Desktop */}
            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-avatar.jpg" alt="Usuario" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled className="text-gray-400 cursor-not-allowed">
                    Editar Perfil
                    <span className="ml-auto text-xs">(Próximamente)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout} className="text-red-600 cursor: focus:text-red-700">
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Menú Hamburguesa Mobile */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <SheetHeader>
                    <SheetTitle className="text-left">Navegación</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-2 mt-6">
                    {navigationLinks.map((link) => (
                      <button
                        key={link.id}
                        onClick={() => handleNavigation(link.id)}
                        className={`${getLinkClasses(link.id)} justify-start text-left w-full`}
                      >
                        {link.label}
                      </button>
                    ))}
                  </nav>

                  {/* Perfil en menú móvil */}
                  <div className="mt-8 pt-6 border-t">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder-avatar.jpg" alt="Usuario" />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Usuario</p>
                        <p className="text-xs text-gray-500">Asesor de Seguros</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        disabled
                        className="w-full justify-start text-left text-gray-400 cursor-not-allowed"
                      >
                        Editar Perfil
                        <span className="ml-auto text-xs">(Próximamente)</span>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={onLogout}
                        className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Cerrar Sesión
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

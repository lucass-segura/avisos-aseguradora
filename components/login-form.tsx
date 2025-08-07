// avisos-aseguradora/components/login-form.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Mail, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase" // 1. Importar el cliente de Supabase

interface LoginFormProps {
  onLoginSuccess: () => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (loginError) {
      setLoginError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")

    // 2. Usar Supabase para iniciar sesión
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      // 3. Manejar errores de Supabase
      setLoginError(error.message)
      setIsLoading(false)
    } else {
      // 4. Si el login es exitoso, llamar a la función onLoginSuccess
      onLoginSuccess()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">GestorPólizas</CardTitle>
            <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email" // Cambiado a type="email" para mejor validación
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="tu@ejemplo.com"
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
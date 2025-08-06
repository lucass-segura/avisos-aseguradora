"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LoginFormProps {
  onLoginSuccess: () => void
}

// Credenciales hardcodeadas
const VALID_EMAIL = "agus@demo.com"
const VALID_PASSWORD = "demo123"

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  const validateEmail = (email: string) => {
    const trimmedEmail = email.trim()

    // 1. Verificar si está vacío
    if (!trimmedEmail) {
      return { isValid: false, error: "El correo electrónico es obligatorio" }
    }

    // 2. Verificar si contiene @
    if (!trimmedEmail.includes("@")) {
      return { isValid: false, error: "El correo debe contener el símbolo @" }
    }

    // 3. Verificar múltiples @
    const atCount = (trimmedEmail.match(/@/g) || []).length
    if (atCount > 1) {
      return { isValid: false, error: "El correo debe contener exactamente un símbolo @" }
    }

    // 4. Dividir en partes
    const parts = trimmedEmail.split("@")
    const localPart = parts[0]
    const domainPart = parts[1]

    // 5. Verificar parte local (antes del @)
    if (!localPart || localPart.length === 0) {
      return { isValid: false, error: "Debe ingresar texto antes del símbolo @" }
    }

    // 6. Verificar parte del dominio (después del @)
    if (!domainPart || domainPart.length === 0) {
      return { isValid: false, error: "Debe ingresar el dominio después del @" }
    }

    // 7. Verificar si el dominio tiene punto
    if (!domainPart.includes(".")) {
      return { isValid: false, error: "El dominio debe contener un punto (ej: .com, .net, .org)" }
    }

    // 8. Verificar extensión del dominio
    const domainParts = domainPart.split(".")
    const extension = domainParts[domainParts.length - 1]

    if (!extension || extension.length < 2) {
      return { isValid: false, error: "La extensión del dominio debe tener al menos 2 caracteres (ej: .com, .net)" }
    }

    // 9. Verificar nombre del dominio
    const domainName = domainParts[0]
    if (!domainName || domainName.length === 0) {
      return { isValid: false, error: "Debe ingresar el nombre del dominio antes del punto" }
    }

    return { isValid: true, error: null }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar email
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error
    }

    // Validar contraseña
    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es obligatoria"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Solo limpiar errores cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    // Limpiar error de login
    if (loginError) {
      setLoginError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Ejecutar validación solo al enviar el formulario
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setLoginError("")

    try {
      // Simular delay del servidor (1-2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Verificar credenciales
      if (formData.email === VALID_EMAIL && formData.password === VALID_PASSWORD) {
        // Login exitoso
        onLoginSuccess()
      } else {
        // Credenciales incorrectas
        setLoginError("Correo o contraseña incorrecta")
      }
    } catch (error) {
      setLoginError("Error de conexión. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
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
              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="text"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="tu@ejemplo.com"
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Campo Contraseña */}
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
                    className={`pl-10 ${errors.password ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              {/* Error de Login */}
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              {/* Botón de Submit */}
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

            {/* Información de Demo */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Credenciales de Demo:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Email:</strong> agus@demo.com
                </p>
                <p>
                  <strong>Contraseña:</strong> demo123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

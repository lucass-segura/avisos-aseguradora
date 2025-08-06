"use client"

import { useState } from "react"
import { AlertCircle, Database, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DatabaseStatusProps {
  onRetry?: () => void
}

export default function DatabaseStatus({ onRetry }: DatabaseStatusProps) {
  const [isChecking, setIsChecking] = useState(false)

  const handleRetry = async () => {
    setIsChecking(true)
    // Esperar un poco para mostrar el estado de carga
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onRetry?.()
    setIsChecking(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <Database className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">Error de Base de Datos</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pueden cargar los datos. Las tablas de la base de datos no existen o no están configuradas
              correctamente.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Para solucionar este problema:</h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Ve a tu panel de Supabase</li>
                <li>Abre el editor SQL</li>
                <li>
                  Ejecuta el script <code className="bg-blue-100 px-1 rounded">00-verify-and-setup.sql</code>
                </li>
                <li>
                  Luego ejecuta <code className="bg-blue-100 px-1 rounded">02-seed-data.sql</code>
                </li>
                <li>Haz clic en "Reintentar" abajo</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Verifica también:</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>Variables de entorno configuradas</li>
                <li>Conexión a internet estable</li>
                <li>Permisos de Supabase correctos</li>
              </ul>
            </div>
          </div>

          <Button onClick={handleRetry} className="w-full" disabled={isChecking}>
            {isChecking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar Conexión
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

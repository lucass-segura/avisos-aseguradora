"use client"

import { useState, useEffect } from "react"
import { Bell, Check, ArrowLeft, RotateCcw, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAvisos, updateAvisoEstado } from "@/actions/avisos"
import DatabaseStatus from "./components/database-status"

interface AvisoConDatos {
  id: number
  estado: "por_vencer" | "avisado" | "pagado"
  fecha_aviso: string | null
  fecha_pago: string | null
  poliza: {
    id: number
    numero: string
    fecha_vencimiento: string
    cliente: {
      id: number
      apellido: string
      nombre: string
    }
    compania: {
      id: number
      nombre: string
    }
  }
}

export default function InsuranceDashboard() {
  const [avisos, setAvisos] = useState<AvisoConDatos[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDatabaseError, setIsDatabaseError] = useState(false)
  const [updatingAvisos, setUpdatingAvisos] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadAvisos()
  }, [])

  const loadAvisos = async () => {
    setIsLoading(true)
    setError(null)
    setIsDatabaseError(false)

    try {
      const result = await getAvisos()

      if (result.success) {
        setAvisos(result.data)
      } else {
        setError(result.error)
        if (
          result.error.includes("does not exist") ||
          result.error.includes("relation") ||
          result.error.includes("table")
        ) {
          setIsDatabaseError(true)
        }
      }
    } catch (err) {
      setError("Error al cargar los avisos")
      setIsDatabaseError(true)
      console.error("Error loading avisos:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateEstado = async (avisoId: number, nuevoEstado: "por_vencer" | "avisado" | "pagado") => {
    setUpdatingAvisos((prev) => new Set(prev).add(avisoId))

    try {
      const result = await updateAvisoEstado(avisoId, nuevoEstado)

      if (result.success) {
        setAvisos((prev) => prev.map((aviso) => (aviso.id === avisoId ? { ...aviso, estado: nuevoEstado } : aviso)))
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError("Error al actualizar el aviso")
      console.error("Error updating aviso:", err)
    } finally {
      setUpdatingAvisos((prev) => {
        const newSet = new Set(prev)
        newSet.delete(avisoId)
        return newSet
      })
    }
  }

  // Si hay error de base de datos, mostrar el componente de estado
  if (isDatabaseError) {
    return <DatabaseStatus onRetry={loadAvisos} />
  }

  // Filtrar avisos por estado
  const avisosPorVencer = avisos.filter((aviso) => aviso.estado === "por_vencer")
  const avisosAvisados = avisos.filter((aviso) => aviso.estado === "avisado")
  const avisosPagados = avisos.filter((aviso) => aviso.estado === "pagado")

  const getCompanyBadgeStyle = (compania: string) => {
    switch (compania) {
      case "Allianz":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "Orbiz":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "La Caja":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "Sancor Seguros":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    const fecha = new Date(dateString)
    const hoy = new Date()
    const diffTime = fecha.getTime() - hoy.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const fechaFormateada = fecha.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    if (diffDays === 0) {
      return `${fechaFormateada} (HOY)`
    } else if (diffDays === 1) {
      return `${fechaFormateada} (MAÑANA)`
    } else if (diffDays > 0) {
      return `${fechaFormateada} (${diffDays} días)`
    } else {
      return `${fechaFormateada} (VENCIDO)`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Cargando avisos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Título principal */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Avisos</h1>
          <p className="mt-2 text-gray-600">Panel de control para el seguimiento de pólizas de seguros</p>
        </div>

        {/* Error Alert */}
        {error && !isDatabaseError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="outline" size="sm" onClick={loadAvisos}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Grid de columnas Kanban */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna 1: Avisos por Vencer */}
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Avisos por Vencer (5 días)</h2>
              <p className="text-sm text-gray-500">{avisosPorVencer.length} pólizas pendientes</p>
            </div>

            <div className="space-y-3">
              {avisosPorVencer.map((aviso) => (
                <Card key={aviso.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={getCompanyBadgeStyle(aviso.poliza.compania.nombre)}>
                        {aviso.poliza.compania.nombre}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <h3 className="font-bold text-gray-900 mb-2">
                      {aviso.poliza.cliente.apellido}, {aviso.poliza.cliente.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">Póliza #{aviso.poliza.numero}</p>
                    <p className="text-sm text-red-600 font-medium">
                      Vence: {formatDate(aviso.poliza.fecha_vencimiento)}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleUpdateEstado(aviso.id, "avisado")}
                      className="w-full"
                      size="sm"
                      disabled={updatingAvisos.has(aviso.id)}
                    >
                      {updatingAvisos.has(aviso.id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Bell className="mr-2 h-4 w-4" />
                      )}
                      Marcar como Avisado
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          {/* Columna 2: Avisado sin Pagar */}
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Avisado sin Pagar</h2>
              <p className="text-sm text-gray-500">{avisosAvisados.length} pólizas avisadas</p>
            </div>

            <div className="space-y-3">
              {avisosAvisados.map((aviso) => (
                <Card key={aviso.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={getCompanyBadgeStyle(aviso.poliza.compania.nombre)}>
                        {aviso.poliza.compania.nombre}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <h3 className="font-bold text-gray-900 mb-2">
                      {aviso.poliza.cliente.apellido}, {aviso.poliza.cliente.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">Póliza #{aviso.poliza.numero}</p>
                    <p className="text-sm text-orange-600 font-medium">
                      Vence: {formatDate(aviso.poliza.fecha_vencimiento)}
                    </p>
                    {aviso.fecha_aviso && (
                      <p className="text-xs text-gray-500 mt-1">Avisado: {formatDate(aviso.fecha_aviso)}</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateEstado(aviso.id, "por_vencer")}
                      className="flex-1"
                      size="sm"
                      variant="ghost"
                      disabled={updatingAvisos.has(aviso.id)}
                    >
                      {updatingAvisos.has(aviso.id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowLeft className="mr-2 h-4 w-4" />
                      )}
                      Devolver
                    </Button>
                    <Button
                      onClick={() => handleUpdateEstado(aviso.id, "pagado")}
                      className="flex-1"
                      size="sm"
                      variant="outline"
                      disabled={updatingAvisos.has(aviso.id)}
                    >
                      {updatingAvisos.has(aviso.id) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Marcar Pagado
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          {/* Columna 3: Pagado */}
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Pagado</h2>
              <p className="text-sm text-gray-500">{avisosPagados.length} pólizas completadas</p>
            </div>

            <div className="space-y-3">
              {avisosPagados.length > 0 ? (
                avisosPagados.map((aviso) => (
                  <Card key={aviso.id} className="shadow-sm hover:shadow-md transition-shadow border-green-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={getCompanyBadgeStyle(aviso.poliza.compania.nombre)}>
                          {aviso.poliza.compania.nombre}
                        </Badge>
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <h3 className="font-bold text-gray-900 mb-2">
                        {aviso.poliza.cliente.apellido}, {aviso.poliza.cliente.nombre}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">Póliza #{aviso.poliza.numero}</p>
                      <p className="text-sm text-green-600 font-medium">
                        Pagado - Vencía: {formatDate(aviso.poliza.fecha_vencimiento)}
                      </p>
                      {aviso.fecha_pago && (
                        <p className="text-xs text-gray-500 mt-1">Pagado: {formatDate(aviso.fecha_pago)}</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => handleUpdateEstado(aviso.id, "avisado")}
                        className="w-full"
                        size="sm"
                        variant="ghost"
                        disabled={updatingAvisos.has(aviso.id)}
                      >
                        {updatingAvisos.has(aviso.id) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-2 h-4 w-4" />
                        )}
                        Devolver a Avisado
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-gray-300 bg-white">
                  <div className="text-center">
                    <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <p className="text-gray-500 font-medium">Las pólizas pagadas aparecerán aquí</p>
                    <p className="text-sm text-gray-400 mt-1">Mueve las tarjetas desde "Avisado sin Pagar"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

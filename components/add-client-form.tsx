"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Loader2, CalendarIcon, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import LocalityCombobox from "./locality-combobox"
import { createCliente } from "@/actions/clientes"
import { useCompanias } from "@/hooks/use-companias"
import { useToast } from "@/hooks/use-toast"

interface Poliza {
  numero: string
  compania_id: number
  fecha_vigencia: Date | undefined
}

interface AddClientFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function AddClientForm({ onSuccess, onCancel }: AddClientFormProps) {
  const [formData, setFormData] = useState({
    apellido: "",
    nombre: "",
    telefono: "",
    email: "",
    localidad: "",
  })
  const [polizas, setPolizas] = useState<Poliza[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { companias, isLoading: isLoadingCompanias, error: companiasError } = useCompanias()
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    console.log(`📝 Actualizando campo ${field}:`, value)
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handlePolizaChange = (index: number, field: keyof Poliza, value: any) => {
    console.log(`📋 Actualizando póliza ${index}, campo ${field}:`, value)
    setPolizas((prev) => prev.map((poliza, i) => (i === index ? { ...poliza, [field]: value } : poliza)))
  }

  const agregarPoliza = () => {
    const nuevaPoliza = {
      numero: "",
      compania_id: 0,
      fecha_vigencia: undefined,
    }
    console.log("➕ Agregando nueva póliza:", nuevaPoliza)
    setPolizas((prev) => [...prev, nuevaPoliza])
  }

  const eliminarPoliza = (index: number) => {
    console.log("🗑️ Eliminando póliza índice:", index)
    setPolizas((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚀 Iniciando envío del formulario")
    console.log("📋 Datos del cliente:", formData)
    console.log("📋 Pólizas a crear:", polizas)

    if (!formData.apellido.trim() || !formData.nombre.trim()) {
      const errorMsg = "El apellido y nombre son obligatorios"
      console.error("❌ Validación fallida:", errorMsg)
      setError(errorMsg)
      return
    }

    // Validar pólizas si existen
    const polizasValidas = polizas.filter(
      (poliza) => poliza.numero.trim() && poliza.compania_id > 0 && poliza.fecha_vigencia,
    )

    if (polizas.length > 0 && polizasValidas.length === 0) {
      const errorMsg = "Si agregas pólizas, deben tener número, compañía y fecha de vigencia"
      console.error("❌ Validación de pólizas fallida:", errorMsg)
      setError(errorMsg)
      return
    }

    console.log(`✅ Pólizas válidas: ${polizasValidas.length} de ${polizas.length}`)

    setIsSubmitting(true)
    setError(null)

    try {
      // Crear cliente con pólizas
      console.log("💾 Enviando datos a createCliente...")
      const result = await createCliente({
        ...formData,
        polizas: polizasValidas.map((poliza) => ({
          numero: poliza.numero,
          compania_id: poliza.compania_id,
          fecha_vigencia: poliza.fecha_vigencia!.toISOString().split("T")[0],
        })),
      })

      if (result.success) {
        console.log("🎉 Cliente creado exitosamente:", result.data)

        // Mostrar notificación de éxito
        toast({
          title: "Cliente creado",
          description: `${formData.apellido}, ${formData.nombre} ha sido agregado correctamente${
            polizasValidas.length > 0 ? ` con ${polizasValidas.length} póliza(s)` : ""
          }.`,
          variant: "default",
        })

        // Limpiar formulario
        console.log("🧹 Limpiando formulario")
        setFormData({
          apellido: "",
          nombre: "",
          telefono: "",
          email: "",
          localidad: "",
        })
        setPolizas([])

        // Llamar callback de éxito
        if (onSuccess) {
          console.log("📞 Llamando callback onSuccess")
          onSuccess()
        }
      } else {
        console.error("❌ Error del servidor:", result.error)
        setError(result.error || "Error al crear el cliente")

        toast({
          title: "Error al crear cliente",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("❌ Error inesperado:", err)
      const errorMsg = "Error de conexión. Verifica tu conexión a internet."
      setError(errorMsg)

      toast({
        title: "Error de conexión",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    console.log("❌ Cancelando formulario")
    setFormData({
      apellido: "",
      nombre: "",
      telefono: "",
      email: "",
      localidad: "",
    })
    setPolizas([])
    setError(null)
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Agregar Nuevo Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Información del Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información del Cliente</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apellido" className="text-sm font-medium">
                      Apellido *
                    </Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => handleInputChange("apellido", e.target.value)}
                      placeholder="Ingrese el apellido"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-sm font-medium">
                      Nombre *
                    </Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
                      placeholder="Ingrese el nombre"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="text-sm font-medium">
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
                      placeholder="+54 299 123 4567"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="email@ejemplo.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localidad" className="text-sm font-medium">
                    Localidad
                  </Label>
                  <LocalityCombobox
                    value={formData.localidad}
                    onChange={(value) => handleInputChange("localidad", value)}
                    placeholder="Buscar y seleccionar localidad..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Separator />

              {/* Sección de Pólizas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Pólizas (Opcional)</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={agregarPoliza}
                    disabled={isSubmitting || isLoadingCompanias}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Póliza
                  </Button>
                </div>

                {companiasError && (
                  <Alert variant="destructive">
                    <AlertDescription>Error al cargar compañías: {companiasError}</AlertDescription>
                  </Alert>
                )}

                {polizas.length > 0 && (
                  <div className="space-y-4">
                    {polizas.map((poliza, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Póliza {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarPoliza(index)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Número de Póliza</Label>
                            <Input
                              value={poliza.numero}
                              onChange={(e) => handlePolizaChange(index, "numero", e.target.value)}
                              placeholder="POL-000000"
                              disabled={isSubmitting}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Compañía</Label>
                            <Select
                              value={poliza.compania_id.toString()}
                              onValueChange={(value) =>
                                handlePolizaChange(index, "compania_id", Number.parseInt(value))
                              }
                              disabled={isSubmitting || isLoadingCompanias}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={isLoadingCompanias ? "Cargando compañías..." : "Seleccionar compañía"}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {companias.map((compania) => (
                                  <SelectItem key={compania.id} value={compania.id.toString()}>
                                    {compania.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Fecha de Vigencia</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !poliza.fecha_vigencia && "text-muted-foreground",
                                  )}
                                  disabled={isSubmitting}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {poliza.fecha_vigencia ? (
                                    format(poliza.fecha_vigencia, "dd/MM/yyyy", { locale: es })
                                  ) : (
                                    <span>Seleccionar fecha</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={poliza.fecha_vigencia}
                                  onSelect={(date) => handlePolizaChange(index, "fecha_vigencia", date)}
                                  initialFocus
                                  locale={es}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 bg-transparent"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoadingCompanias}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando Cliente...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Cliente
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

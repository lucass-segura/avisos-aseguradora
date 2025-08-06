"use client"

import { useState, useEffect } from "react"
import { Edit, Save, Trash2, Loader2, Plus } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import LocalityCombobox from "./locality-combobox"
import { getPolizasByClienteId, createPoliza, updatePoliza, deletePoliza } from "@/actions/polizas"
import { updateCliente } from "@/actions/clientes"
import { useCompanias } from "@/hooks/use-companias"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface Cliente {
  id: number
  apellido: string
  nombre: string
  telefono: string | null
  email: string | null
  localidad: string | null
}

interface Poliza {
  id?: number
  numero: string
  compania_id: number
  compania?: { id: number; nombre: string }
  fecha_vigencia: Date | undefined
}

interface Compania {
  id: number
  nombre: string
}

interface ClientDetailModalProps {
  cliente: Cliente | null
  isOpen: boolean
  onClose: () => void
  onSave: (cliente: Cliente) => void
  onDelete?: (clienteId: number) => void
}

export default function ClientDetailModal({ cliente, isOpen, onClose, onSave, onDelete }: ClientDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    apellidoNombre: "",
    contacto: "",
    email: "",
    localidad: "",
  })
  const [polizas, setPolizas] = useState<Poliza[]>([])
  const { companias, isLoading: isLoadingCompanias, error: companiasError } = useCompanias()
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const [isLoadingPolizas, setIsLoadingPolizas] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (cliente && isOpen) {
      console.log("📋 Cargando datos del cliente en modal:", cliente)
      setFormData({
        apellidoNombre: `${cliente.apellido}, ${cliente.nombre}`,
        contacto: cliente.telefono || "",
        email: cliente.email || "",
        localidad: cliente.localidad || "",
      })
      loadPolizas()
    }
  }, [cliente, isOpen])

  const loadPolizas = async () => {
    if (!cliente) return

    console.log("📋 Cargando pólizas para cliente ID:", cliente.id)
    setIsLoadingPolizas(true)
    try {
      const result = await getPolizasByClienteId(cliente.id)
      if (result.success) {
        const polizasFormateadas = result.data.map((p: any) => ({
          id: p.id,
          numero: p.numero,
          compania_id: p.compania_id,
          compania: p.compania,
          fecha_vigencia: p.fecha_vigencia ? new Date(p.fecha_vigencia) : undefined,
        }))
        console.log("✅ Pólizas cargadas y formateadas:", polizasFormateadas)
        setPolizas(polizasFormateadas)
      } else {
        console.error("❌ Error al cargar pólizas:", result.error)
      }
    } catch (error) {
      console.error("❌ Error inesperado al cargar pólizas:", error)
    } finally {
      setIsLoadingPolizas(false)
    }
  }

  const handleEdit = () => {
    console.log("✏️ Iniciando modo edición")
    setIsEditing(true)
  }

  const handleCancel = () => {
    console.log("❌ Cancelando edición")
    setIsEditing(false)
    if (cliente) {
      setFormData({
        apellidoNombre: `${cliente.apellido}, ${cliente.nombre}`,
        contacto: cliente.telefono || "",
        email: cliente.email || "",
        localidad: cliente.localidad || "",
      })
    }
    loadPolizas() // Recargar pólizas originales
  }

  const handleSave = async () => {
    if (!cliente) return

    console.log("💾 Guardando cambios del cliente...")
    setIsSaving(true)
    try {
      // Parsear el nombre completo
      const [apellido, ...nombreParts] = formData.apellidoNombre.split(", ")
      const nombre = nombreParts.join(", ")

      console.log("📝 Datos parseados - Apellido:", apellido, "Nombre:", nombre)

      // Actualizar cliente
      const clienteResult = await updateCliente(cliente.id, {
        apellido: apellido || cliente.apellido,
        nombre: nombre || cliente.nombre,
        contacto: formData.contacto,
        email: formData.email.trim() || undefined,
        localidad: formData.localidad,
      })

      if (clienteResult.success) {
        console.log("✅ Cliente actualizado, procesando pólizas...")

        // Guardar pólizas
        for (let i = 0; i < polizas.length; i++) {
          const poliza = polizas[i]
          console.log(`📋 Procesando póliza ${i + 1}/${polizas.length}:`, poliza)

          const polizaData = {
            numero: poliza.numero,
            compania_id: poliza.compania_id,
            fecha_vigencia: poliza.fecha_vigencia ? poliza.fecha_vigencia.toISOString().split("T")[0] : null,
          }

          if (poliza.id) {
            // Actualizar póliza existente
            console.log("🔄 Actualizando póliza existente ID:", poliza.id)
            const updateResult = await updatePoliza(poliza.id, polizaData)
            if (updateResult.success) {
              console.log("✅ Póliza actualizada exitosamente")
            } else {
              console.error("❌ Error al actualizar póliza:", updateResult.error)
            }
          } else {
            // Crear nueva póliza
            console.log("➕ Creando nueva póliza")
            const createResult = await createPoliza({
              ...polizaData,
              cliente_id: cliente.id,
            })
            if (createResult.success) {
              console.log("✅ Nueva póliza creada exitosamente")
            } else {
              console.error("❌ Error al crear póliza:", createResult.error)
            }
          }
        }

        console.log("🎉 Guardado completado exitosamente")
        onSave(clienteResult.data)
        setIsEditing(false)
        loadPolizas() // Recargar para obtener IDs actualizados
      } else {
        console.error("❌ Error al actualizar cliente:", clienteResult.error)
      }
    } catch (error) {
      console.error("❌ Error inesperado durante el guardado:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    console.log("🚪 Cerrando modal")
    setIsEditing(false)
    onClose()
  }

  const handleDeleteClick = async () => {
    if (isDeleting || !cliente || !onDelete) return

    console.log("🗑️ Solicitando confirmación del navegador para eliminar cliente")

    const confirmMessage = `¿Estás seguro de que quieres eliminar al cliente "${cliente.apellido}, ${cliente.nombre}"?\n\nEsta acción eliminará permanentemente al cliente y todas sus pólizas asociadas. Esta acción no se puede deshacer.`

    const confirmed = window.confirm(confirmMessage)

    if (!confirmed) {
      console.log("❌ Usuario canceló la eliminación")
      return
    }

    console.log("✅ Usuario confirmó la eliminación, procediendo...")
    setIsDeleting(true)

    try {
      await onDelete(cliente.id)

      // Show success notification
      console.log("✅ Cliente eliminado exitosamente, mostrando notificación")
      toast({
        title: "Cliente eliminado",
        description: `El cliente ${cliente.apellido}, ${cliente.nombre} ha sido eliminado correctamente.`,
        variant: "default",
      })

      // Close modal
      onClose()
    } catch (error) {
      console.error("❌ Error al eliminar cliente:", error)

      // Show error notification
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePolizaChange = (index: number, field: keyof Poliza, value: any) => {
    console.log("📋 Actualizando póliza índice:", index, "Campo:", field, "Valor:", value)
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

  const eliminarPoliza = async (index: number) => {
    const poliza = polizas[index]
    console.log("🗑️ Eliminando póliza índice:", index, "Datos:", poliza)

    if (poliza.id) {
      // Si tiene ID, eliminar de la base de datos
      try {
        console.log("💾 Eliminando póliza de la base de datos ID:", poliza.id)
        const result = await deletePoliza(poliza.id)
        if (!result.success) {
          console.error("❌ Error al eliminar póliza de BD:", result.error)
          return
        }
        console.log("✅ Póliza eliminada de la base de datos")
      } catch (error) {
        console.error("❌ Error inesperado al eliminar póliza:", error)
        return
      }
    }

    // Eliminar del estado local
    console.log("🔄 Eliminando póliza del estado local")
    setPolizas((prev) => prev.filter((_, i) => i !== index))
  }

  if (!cliente) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="client-detail-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Editar Cliente" : "Detalle del Cliente"}
          </DialogTitle>
          <div id="client-detail-description" className="sr-only">
            {isEditing
              ? "Formulario para editar la información del cliente y sus pólizas"
              : "Información detallada del cliente y sus pólizas activas"}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Cliente */}
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apellidoNombre" className="text-sm font-medium">
                    Apellido y Nombre
                  </Label>
                  <Input
                    id="apellidoNombre"
                    value={formData.apellidoNombre}
                    onChange={(e) => setFormData({ ...formData, apellidoNombre: e.target.value })}
                    placeholder="Apellido, Nombre"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contacto" className="text-sm font-medium">
                    Contacto
                  </Label>
                  <Input
                    id="contacto"
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                    placeholder="+54 299 123 4567"
                    className="w-full"
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localidad" className="text-sm font-medium">
                    Localidad
                  </Label>
                  <LocalityCombobox
                    value={formData.localidad}
                    onChange={(value) => setFormData({ ...formData, localidad: value })}
                    placeholder="Buscar y seleccionar localidad..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Apellido y Nombre</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {cliente.apellido}, {cliente.nombre}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Contacto</h3>
                  <p className="text-lg text-gray-900">{cliente.telefono || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <p className="text-lg text-gray-900">{cliente.email || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Localidad</h3>
                  <p className="text-lg text-gray-900">{cliente.localidad || "-"}</p>
                </div>
              </div>
            )}

            {!isEditing && (
              <div className="pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Eliminando..." : "Eliminar Cliente"}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Sección de Pólizas Activas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pólizas Activas</h3>
              {isEditing && (
                <Button variant="outline" size="sm" onClick={agregarPoliza}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Póliza
                </Button>
              )}
            </div>

            {isLoadingPolizas ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Cargando pólizas...</span>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">N° de Póliza</TableHead>
                      <TableHead className="font-semibold">Compañía</TableHead>
                      <TableHead className="font-semibold">Fecha de Vigencia</TableHead>
                      {isEditing && <TableHead className="font-semibold w-20">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {polizas.length > 0 ? (
                      polizas.map((poliza, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={poliza.numero}
                                onChange={(e) => handlePolizaChange(index, "numero", e.target.value)}
                                placeholder="POL-000000"
                                className="w-full"
                              />
                            ) : (
                              <span className="font-medium">{poliza.numero}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Select
                                value={poliza.compania_id.toString()}
                                onValueChange={(value) =>
                                  handlePolizaChange(index, "compania_id", Number.parseInt(value))
                                }
                                disabled={isLoadingCompanias}
                              >
                                <SelectTrigger className="w-full">
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
                            ) : (
                              <span>{poliza.compania?.nombre || "No especificada"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !poliza.fecha_vigencia && "text-muted-foreground",
                                    )}
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
                            ) : (
                              <span>
                                {poliza.fecha_vigencia
                                  ? format(poliza.fecha_vigencia, "dd/MM/yyyy", { locale: es })
                                  : "No especificada"}
                              </span>
                            )}
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarPoliza(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isEditing ? 5 : 4} className="text-center py-4 text-gray-500">
                          No hay pólizas activas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          {companiasError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>Error al cargar compañías: {companiasError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-4">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Cerrar
              </Button>
              <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

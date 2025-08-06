"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DatabaseStatus from "./database-status"
import { getCompanias, createCompania, updateCompania } from "@/actions/companias"

interface Compania {
  id: number
  nombre: string
  created_at: string
  updated_at: string
}

export default function CompaniesManagement() {
  const [companias, setCompanias] = useState<Compania[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [currentCompania, setCurrentCompania] = useState<Compania | null>(null)
  const [formData, setFormData] = useState({ nombre: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDatabaseError, setIsDatabaseError] = useState(false)

  useEffect(() => {
    loadCompanias()
  }, [])

  const loadCompanias = async () => {
    setIsLoading(true)
    setError(null)
    setIsDatabaseError(false)

    try {
      const result = await getCompanias()

      if (result.success) {
        setCompanias(result.data)
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
      setError("Error al cargar las compañías")
      setIsDatabaseError(true)
      console.error("Error loading companias:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Si hay error de base de datos, mostrar el componente de estado
  if (isDatabaseError) {
    return <DatabaseStatus onRetry={loadCompanias} />
  }

  const handleAddCompania = () => {
    setModalMode("add")
    setCurrentCompania(null)
    setFormData({ nombre: "" })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleEditCompania = (compania: Compania) => {
    setModalMode("edit")
    setCurrentCompania(compania)
    setFormData({ nombre: compania.nombre })
    setErrors({})
    setIsModalOpen(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre de la compañía es obligatorio"
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres"
    } else {
      // Verificar si ya existe una compañía con ese nombre (excepto la actual en modo edición)
      const nombreExiste = companias.some(
        (c) => c.nombre.toLowerCase() === formData.nombre.trim().toLowerCase() && c.id !== currentCompania?.id,
      )
      if (nombreExiste) {
        newErrors.nombre = "Ya existe una compañía con este nombre"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      const nombreTrimmed = formData.nombre.trim()

      if (modalMode === "add") {
        const result = await createCompania(nombreTrimmed)
        if (result.success) {
          setCompanias((prev) => [...prev, result.data])
          handleCloseModal()
        } else {
          setError(result.error)
        }
      } else if (modalMode === "edit" && currentCompania) {
        const result = await updateCompania(currentCompania.id, nombreTrimmed)
        if (result.success) {
          setCompanias((prev) => prev.map((c) => (c.id === currentCompania.id ? result.data : c)))
          handleCloseModal()
        } else {
          setError(result.error)
        }
      }
    } catch (err) {
      setError("Error al guardar la compañía")
      console.error("Error saving compania:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentCompania(null)
    setFormData({ nombre: "" })
    setErrors({})
  }

  const handleInputChange = (value: string) => {
    setFormData({ nombre: value })
    // Limpiar error cuando el usuario empiece a escribir
    if (errors.nombre) {
      setErrors({})
    }
    // Limpiar error general
    if (error) {
      setError(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Cargando compañías...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Encabezado */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compañías de Seguros</h1>
            <p className="mt-2 text-gray-600">Administra las compañías de seguros disponibles en el sistema</p>
          </div>
          <Button onClick={handleAddCompania} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Compañía
          </Button>
        </div>

        {/* Error Alert */}
        {error && !isDatabaseError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="outline" size="sm" onClick={loadCompanias}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabla de Compañías */}
        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Nombre de la Compañía</TableHead>
                <TableHead className="font-semibold">Fecha de Creación</TableHead>
                <TableHead className="font-semibold text-center w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companias.length > 0 ? (
                companias.map((compania) => (
                  <TableRow key={compania.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900">{compania.nombre}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(compania.created_at).toLocaleDateString("es-AR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCompania(compania)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar {compania.nombre}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <div className="text-gray-500">
                      <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Plus className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium">No hay compañías registradas</p>
                      <p className="text-sm">Agrega tu primera compañía de seguros</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Información adicional */}
        {companias.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Total: {companias.length} compañía{companias.length !== 1 ? "s" : ""} registrada
            {companias.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Modal de Agregar/Editar Compañía */}
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {modalMode === "add" ? "Agregar Nueva Compañía" : "Editar Compañía"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium">
                  Nombre de la Compañía <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Ej: Allianz, Orbiz, Sancor Seguros..."
                  className={errors.nombre ? "border-red-500" : ""}
                  disabled={isSaving}
                />
                {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="secondary" onClick={handleCloseModal} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

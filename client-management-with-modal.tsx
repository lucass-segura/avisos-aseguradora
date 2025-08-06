"use client"

import { useState, useEffect } from "react"
import { Search, Eye, Phone, Mail, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ClientDetailModal from "./client-detail-modal"
import DatabaseStatus from "./components/database-status"
import { searchIgnoreAccents } from "@/lib/utils"
import { getClientes, deleteCliente } from "@/actions/clientes"
import type { Cliente } from "@/lib/supabase"

interface ClientManagementWithModalProps {
  onAddClient?: () => void
}

export default function ClientManagementWithModal({ onAddClient }: ClientManagementWithModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDatabaseError, setIsDatabaseError] = useState(false)

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    setIsLoading(true)
    setError(null)
    setIsDatabaseError(false)

    try {
      const result = await getClientes()

      if (result.success) {
        setClientes(result.data)
      } else {
        setError(result.error)
        // Verificar si es un error de base de datos
        if (
          result.error.includes("does not exist") ||
          result.error.includes("tablas de la base de datos") ||
          result.error.includes("relation") ||
          result.error.includes("table")
        ) {
          setIsDatabaseError(true)
        }
      }
    } catch (err) {
      setError("Error al cargar los clientes")
      setIsDatabaseError(true)
      console.error("Error loading clientes:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Si hay error de base de datos, mostrar el componente de estado
  if (isDatabaseError) {
    return <DatabaseStatus onRetry={loadClientes} />
  }

  // Filtrar clientes basado en el término de búsqueda (ignorando acentos)
  const clientesFiltrados = clientes.filter((cliente) =>
    searchIgnoreAccents(searchTerm, `${cliente.apellido} ${cliente.nombre}`),
  )

  const handleVerDetalles = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsModalOpen(true)
  }

  const handleSaveCliente = (clienteActualizado: Cliente) => {
    setClientes((prev) => prev.map((cliente) => (cliente.id === clienteActualizado.id ? clienteActualizado : cliente)))
    console.log("Cliente actualizado:", clienteActualizado)
  }

const handleDeleteCliente = async (clienteId: number) => {
    try {
      const result = await deleteCliente(clienteId);

      if (result.success) {
        setClientes((prevClientes) =>
          prevClientes.filter((cliente) => cliente.id !== clienteId)
        );
        handleCloseModal();
      } else {
        setError(result.error || "No se pudo eliminar el cliente.");
      }
    } catch (err) {
      setError("Error de conexión al intentar eliminar.");
      console.error("Error en handleDeleteCliente:", err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCliente(null)
  }

  const handleRefresh = () => {
    loadClientes()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Cargando clientes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Título principal */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Listado de Clientes</h1>
          <p className="mt-2 text-gray-600">Gestiona y busca información de tus clientes</p>
        </div>

        {/* Error Alert */}
        {error && !isDatabaseError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Barra de búsqueda y botón agregar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar cliente por nombre o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600">
                {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""} encontrado
                {clientesFiltrados.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              Actualizar
            </Button>
            <Button onClick={onAddClient} className="bg-blue-600 hover:bg-blue-700 shrink-0">
              + Agregar Cliente
            </Button>
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Apellido y Nombre</TableHead>
                <TableHead className="font-semibold">Contacto</TableHead>
                <TableHead className="font-semibold">Localidad</TableHead>
                <TableHead className="font-semibold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <TableRow
                    key={cliente.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleVerDetalles(cliente)}
                  >
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {cliente.apellido}, {cliente.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="mr-2 h-4 w-4" />
                          {cliente.telefono || "No especificado"}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="mr-2 h-4 w-4" />
                          {cliente.email || "No especificado"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{cliente.localidad || "No especificada"}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVerDetalles(cliente)
                        }}
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-gray-500">
                      <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No se encontraron clientes</p>
                      <p className="text-sm">
                        {searchTerm ? `No hay resultados para "${searchTerm}"` : "No hay clientes registrados"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Información adicional */}
        {clientesFiltrados.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Mostrando {clientesFiltrados.length} de {clientes.length} clientes
          </div>
        )}

        {/* Modal de detalles del cliente */}
        <ClientDetailModal
          cliente={selectedCliente}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCliente}
          onDelete={handleDeleteCliente}
        />
      </div>
    </div>
  )
}

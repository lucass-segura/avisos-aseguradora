"use client"

import { useState } from "react"
import { Search, Eye, Phone, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Datos de ejemplo para los clientes
const clientesData = [
  {
    id: 1,
    apellido: "García",
    nombre: "María Elena",
    telefono: "+54 11 4567-8901",
    email: "maria.garcia@email.com",
  },
  {
    id: 2,
    apellido: "Rodríguez",
    nombre: "Carlos Alberto",
    telefono: "+54 11 2345-6789",
    email: "carlos.rodriguez@email.com",
  },
  {
    id: 3,
    apellido: "López",
    nombre: "Ana Sofía",
    telefono: "+54 11 8765-4321",
    email: "ana.lopez@email.com",
  },
  {
    id: 4,
    apellido: "Martínez",
    nombre: "Roberto José",
    telefono: "+54 11 5432-1098",
    email: "roberto.martinez@email.com",
  },
]

export default function ClientManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar clientes basado en el término de búsqueda
  const clientesFiltrados = clientesData.filter((cliente) =>
    `${cliente.apellido} ${cliente.nombre}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleVerDetalles = (clienteId: number) => {
    console.log(`Ver detalles del cliente ${clienteId}`)
    // Aquí iría la navegación a la página de detalles del cliente
  }

  const handleRowClick = (clienteId: number) => {
    handleVerDetalles(clienteId)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Título principal */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Listado de Clientes</h1>
          <p className="mt-2 text-gray-600">Gestiona y busca información de tus clientes</p>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative max-w-md">
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

        {/* Tabla de clientes */}
        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Apellido y Nombre</TableHead>
                <TableHead className="font-semibold">Contacto</TableHead>
                <TableHead className="font-semibold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <TableRow
                    key={cliente.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(cliente.id)}
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
                          {cliente.telefono}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="mr-2 h-4 w-4" />
                          {cliente.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation() // Evita que se dispare el click de la fila
                          handleVerDetalles(cliente.id)
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
                  <TableCell colSpan={3} className="text-center py-8">
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
            Mostrando {clientesFiltrados.length} de {clientesData.length} clientes
          </div>
        )}
      </div>
    </div>
  )
}

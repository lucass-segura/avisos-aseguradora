"use client"

import { useState } from "react"
import Navigation from "./components/navigation"
import InsuranceDashboard from "./dashboard"
import ClientManagementWithModal from "./client-management-with-modal"

// Componente placeholder para Compañías
function CompaniesManagement() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Compañías</h1>
          <p className="mt-2 text-gray-600">Administra las compañías de seguros disponibles</p>
        </div>

        <div className="rounded-lg border bg-white shadow-sm p-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-2 0H9m-2 0H7m-2 0H5"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Próximamente</h3>
            <p className="text-gray-500">La gestión de compañías estará disponible pronto.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppWithNavigation() {
  const [currentPage, setCurrentPage] = useState<"avisos" | "clientes" | "companias">("avisos")

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "avisos":
        return <InsuranceDashboard />
      case "clientes":
        return <ClientManagementWithModal />
      case "companias":
        return <CompaniesManagement />
      default:
        return <InsuranceDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="pt-0">{renderCurrentPage()}</main>
    </div>
  )
}

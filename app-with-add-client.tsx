"use client"

import { useState } from "react"
import Navigation from "./components/navigation"
import InsuranceDashboard from "./dashboard"
import ClientManagementWithModal from "./client-management-with-modal"
import AddClientForm from "./components/add-client-form"
import CompaniesManagement from "./components/companies-management"

export default function AppWithAddClient() {
  const [currentPage, setCurrentPage] = useState<"avisos" | "clientes" | "companias" | "add-client">("avisos")

  const handleSaveClient = (clientData: any) => {
    console.log("Cliente guardado:", clientData)
    // Aquí iría la lógica para guardar en la base de datos
    // Después de guardar, volver al listado de clientes
    setCurrentPage("clientes")
  }

  const handleCancelAddClient = () => {
    setCurrentPage("clientes")
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "avisos":
        return <InsuranceDashboard />
      case "clientes":
        return (
          <div>
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
              <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage("add-client")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    + Agregar Cliente
                  </button>
                </div>
              </div>
            </div>
            <div className="-mt-24">
              <ClientManagementWithModal />
            </div>
          </div>
        )
      case "add-client":
        return (
          <AddClientForm
            onBack={() => setCurrentPage("clientes")}
            onSave={handleSaveClient}
            onCancel={handleCancelAddClient}
          />
        )
      case "companias":
        return <CompaniesManagement />
      default:
        return <InsuranceDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage === "add-client" ? "clientes" : currentPage} onNavigate={setCurrentPage} />
      <main className="pt-0">{renderCurrentPage()}</main>
    </div>
  )
}

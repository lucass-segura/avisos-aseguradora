"use client"

import { useState, useRef } from "react"
import Navigation from "./components/navigation"
import InsuranceDashboard from "./dashboard"
import ClientManagementWithModal from "./client-management-with-modal"
import AddClientForm from "./components/add-client-form"
import CompaniesManagement from "./components/companies-management"
import DatabaseSetup from "./components/database-setup"

interface AppWithAuthProps {
  user: {
    id: string
    email?: string
  }
}

export default function AppWithAuth({ user }: AppWithAuthProps) {
  console.log("🏠 Cargando aplicación principal para usuario:", user.email)

  const [currentPage, setCurrentPage] = useState<"avisos" | "clientes" | "companias" | "add-client">("avisos")
  const [isDatabaseError, setIsDatabaseError] = useState(false)
  const clientManagementRef = useRef<any>(null)

  const handleSaveClient = (clientData: any) => {
    console.log("✅ Cliente guardado:", clientData)
    setCurrentPage("clientes")
  }

  const handleCancelAddClient = () => {
    console.log("❌ Cancelada creación de cliente")
    setCurrentPage("clientes")
  }

  const handleDatabaseRetry = () => {
    console.log("🔄 Reintentando conexión a base de datos...")
    setIsDatabaseError(false)
    window.location.reload()
  }

  if (isDatabaseError) {
    return <DatabaseSetup onRetry={handleDatabaseRetry} />
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "avisos":
        return <InsuranceDashboard />
      case "clientes":
        return <ClientManagementWithModal onAddClient={() => setCurrentPage("add-client")} />
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
      <Navigation
        currentPage={currentPage === "add-client" ? "clientes" : currentPage}
        onNavigate={setCurrentPage}
        user={user}
      />
      <main className="pt-0">{renderCurrentPage()}</main>
    </div>
  )
}

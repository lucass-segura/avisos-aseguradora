"use client"

import { useState, useRef } from "react"
import LoginForm from "./components/login-form"
import Navigation from "./components/navigation"
import InsuranceDashboard from "./dashboard"
import ClientManagementWithModal from "./client-management-with-modal"
import AddClientForm from "./components/add-client-form"
import CompaniesManagement from "./components/companies-management"
import DatabaseSetup from "./components/database-setup"

export default function AppWithAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState<"avisos" | "clientes" | "companias" | "add-client">("avisos")
  const [isDatabaseError, setIsDatabaseError] = useState(false)
  const clientManagementRef = useRef<any>(null)

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setCurrentPage("avisos")
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentPage("avisos")
  }

  const handleSaveClient = (clientData: any) => {
    console.log("Cliente guardado:", clientData)
    // Ya no necesitamos agregar manualmente, Supabase se encarga de la persistencia
    // y el componente se actualizará automáticamente
    setCurrentPage("clientes")
  }

  const handleCancelAddClient = () => {
    setCurrentPage("clientes")
  }

  const handleDatabaseRetry = () => {
    setIsDatabaseError(false)
    // La aplicación se recargará automáticamente
    window.location.reload()
  }

  // Si hay error de base de datos, mostrar configuración
  if (isDatabaseError) {
    return <DatabaseSetup onRetry={handleDatabaseRetry} />
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  // Si está autenticado, mostrar la aplicación principal
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
        onLogout={handleLogout}
      />
      <main className="pt-0">{renderCurrentPage()}</main>
    </div>
  )
}

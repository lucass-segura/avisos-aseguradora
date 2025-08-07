"use client"

import { useEffect, useState } from "react"
import LoginForm from "./components/login-form"
import Navigation from "./components/navigation"
import InsuranceDashboard from "./dashboard"
import ClientManagementWithModal from "./client-management-with-modal"
import AddClientForm from "./components/add-client-form"
import CompaniesManagement from "./components/companies-management"
import DatabaseSetup from "./components/database-setup"
import { supabase } from "@/lib/supabase"

interface User {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
  }
}

export default function AppWithAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState<"avisos" | "clientes" | "companias" | "add-client">("avisos")
  const [isDatabaseError, setIsDatabaseError] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user as User);
        setIsAuthenticated(true);
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user as User)
    setIsAuthenticated(true)
    setCurrentPage("avisos")
  }

   const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAuthenticated(false)
    setCurrentPage("avisos")
  }

  const handleSaveClient = (clientData: any) => {
    console.log("Cliente guardado:", clientData)
    setCurrentPage("clientes")
  }

  const handleCancelAddClient = () => {
    setCurrentPage("clientes")
  }

  const handleDatabaseRetry = () => {
    setIsDatabaseError(false)
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
    const userName = user?.user_metadata?.full_name || user?.email || "Usuario desconocido";
    switch (currentPage) {
      case "avisos":
        return <InsuranceDashboard userName={userName} />
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
        return <InsuranceDashboard userName={userName} />
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

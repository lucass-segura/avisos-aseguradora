import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AppWithAuth from "../app-with-auth"

export default async function Page() {
  console.log("🔍 Verificando autenticación en página principal...")

  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("🔍 Auth check result:", { hasUser: !!user, error: error?.message })

    if (!user || error) {
      console.log("❌ Usuario no autenticado, redirigiendo a login...")
      redirect("/auth/login")
    }

    console.log("✅ Usuario autenticado:", user.email)
    return <AppWithAuth user={user} />
  } catch (error) {
    console.error("❌ Error durante verificación de autenticación:", error)
    redirect("/auth/login")
  }
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LoginForm from "@/components/auth/login-form"

export default async function LoginPage() {
  console.log("🔍 Verificando estado de autenticación en página de login...")

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    console.log("✅ Usuario ya autenticado, redirigiendo a dashboard...")
    redirect("/")
  }

  console.log("📋 Mostrando formulario de login...")
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  )
}

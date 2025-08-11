import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SignUpForm from "@/components/auth/sign-up-form"

export default async function SignUpPage() {
  console.log("🔍 Verificando estado de autenticación en página de registro...")

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    console.log("✅ Usuario ya autenticado, redirigiendo a dashboard...")
    redirect("/")
  }

  console.log("📝 Mostrando formulario de registro...")
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  )
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  console.log("🔐 Iniciando proceso de login...")

  if (!formData) {
    console.log("❌ Error: FormData faltante")
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  console.log("📧 Email recibido:", email)

  if (!email || !password) {
    console.log("❌ Error: Email o contraseña faltantes")
    return { error: "Email y contraseña son requeridos" }
  }

  const supabase = createClient()

  try {
    console.log("🔄 Intentando autenticación con Supabase...")
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      console.log("❌ Error de autenticación:", error.message)
      return { error: error.message }
    }

    console.log("✅ Login exitoso para usuario:", data.user?.email)
    return { success: true }
  } catch (error) {
    console.error("💥 Error inesperado en login:", error)
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  console.log("📝 Iniciando proceso de registro...")

  if (!formData) {
    console.log("❌ Error: FormData faltante")
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  console.log("📧 Email para registro:", email)

  if (!email || !password) {
    console.log("❌ Error: Email o contraseña faltantes")
    return { error: "Email y contraseña son requeridos" }
  }

  const supabase = createClient()

  try {
    console.log("🔄 Intentando registro con Supabase...")
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.log("❌ Error de registro:", error.message)
      return { error: error.message }
    }

    console.log("✅ Registro exitoso para usuario:", data.user?.email)
    return { success: "Revisa tu email para confirmar tu cuenta." }
  } catch (error) {
    console.error("💥 Error inesperado en registro:", error)
    return { error: "Ocurrió un error inesperado. Intenta de nuevo." }
  }
}

export async function signOut() {
  console.log("🚪 Iniciando proceso de logout...")

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.log("❌ Error en logout:", error.message)
    } else {
      console.log("✅ Logout exitoso")
    }
  } catch (error) {
    console.error("💥 Error inesperado en logout:", error)
  }

  redirect("/auth/login")
}

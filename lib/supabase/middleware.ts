import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function updateSession(request: NextRequest) {
  console.log("🔍 Middleware: Processing request for:", request.nextUrl.pathname)

  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    console.log("⚠️ Middleware: Supabase not configured, skipping auth")
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Check if this is an auth callback
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    console.log("🔄 Middleware: Processing auth callback with code")
    try {
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error("❌ Middleware: Error exchanging code for session:", error)
        return NextResponse.redirect(new URL("/auth/login?error=auth_callback_error", request.url))
      }
      console.log("✅ Middleware: Successfully exchanged code for session")
      // Redirect to home page after successful auth
      return NextResponse.redirect(new URL("/", request.url))
    } catch (error) {
      console.error("❌ Middleware: Exception during code exchange:", error)
      return NextResponse.redirect(new URL("/auth/login?error=auth_callback_error", request.url))
    }
  }

  // Protected routes - redirect to login if not authenticated
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/sign-up") ||
    request.nextUrl.pathname === "/auth/callback"

  console.log("🔍 Middleware: Is auth route?", isAuthRoute, "Path:", request.nextUrl.pathname)

  if (!isAuthRoute) {
    try {
      // Refresh session if expired - required for Server Components
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      console.log("🔍 Middleware: Session check result:", {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message,
      })

      if (!session || error) {
        console.log("🚫 Middleware: No valid session, redirecting to login")
        const redirectUrl = new URL("/auth/login", request.url)
        return NextResponse.redirect(redirectUrl)
      }

      console.log("✅ Middleware: Valid session found, allowing access")
    } catch (error) {
      console.error("❌ Middleware: Exception during session check:", error)
      const redirectUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

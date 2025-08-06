import { createClient } from "@supabase/supabase-js"

// Verificar que las variables de entorno estén configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan las variables de entorno de Supabase. Asegúrate de configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON",
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función para verificar la conexión a Supabase
export async function verifySupabaseConnection() {
  try {
    const { data, error } = await supabase.from("clientes").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Error verificando conexión a Supabase:", error)
      return { success: false, error: error.message }
    }

    return { success: true, message: "Conexión exitosa a Supabase" }
  } catch (error) {
    console.error("Error de conexión:", error)
    return { success: false, error: "Error de conexión a la base de datos" }
  }
}

// Tipos para TypeScript
export interface Cliente {
  id: number
  apellido: string
  nombre: string
  telefono: string | null
  email: string | null
  localidad: string | null
  created_at: string
  updated_at: string
}

export interface Compania {
  id: number
  nombre: string
  created_at: string
  updated_at: string
}

export interface Poliza {
  id: number
  numero: string
  compania_id: number
  cliente_id: number
  fecha_inicio: string | null
  fecha_vencimiento: string | null
  created_at: string
  updated_at: string
  compania?: Compania
  cliente?: Cliente
}

export interface Aviso {
  id: number
  poliza_id: number
  estado: "por_vencer" | "avisado" | "pagado"
  fecha_aviso: string | null
  fecha_pago: string | null
  notas: string | null
  created_at: string
  updated_at: string
  poliza?: Poliza & { compania: Compania; cliente: Cliente }
}

export interface ClienteConPolizas extends Cliente {
  polizas: (Poliza & { compania: Compania })[]
}

"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getCompanias() {
  try {
    console.log("🏢 Obteniendo compañías de la base de datos...")

    const { data, error } = await supabase.from("companias").select("*").order("nombre", { ascending: true })

    if (error) {
      console.error("❌ Error fetching companias:", error)
      return { success: false, error: error.message, data: [] }
    }

    console.log("✅ Compañías obtenidas exitosamente:", data?.length || 0, "registros")
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("❌ Error in getCompanias:", error)
    return { success: false, error: "Error interno del servidor", data: [] }
  }
}

export async function createCompania(nombre: string) {
  try {
    console.log("🏢 Creando nueva compañía:", nombre)

    const { data, error } = await supabase.from("companias").insert({ nombre: nombre.trim() }).select().single()

    if (error) {
      console.error("❌ Error creating compania:", error)
      return { success: false, error: error.message, data: null }
    }

    console.log("✅ Compañía creada exitosamente:", data)
    revalidatePath("/companias")
    return { success: true, data }
  } catch (error) {
    console.error("❌ Error in createCompania:", error)
    return { success: false, error: "Error interno del servidor", data: null }
  }
}

export async function updateCompania(id: number, nombre: string) {
  try {
    console.log("🔄 Actualizando compañía ID:", id, "Nuevo nombre:", nombre)

    const { data, error } = await supabase
      .from("companias")
      .update({ nombre: nombre.trim() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating compania:", error)
      return { success: false, error: error.message, data: null }
    }

    console.log("✅ Compañía actualizada exitosamente:", data)
    revalidatePath("/companias")
    return { success: true, data }
  } catch (error) {
    console.error("❌ Error in updateCompania:", error)
    return { success: false, error: "Error interno del servidor", data: null }
  }
}

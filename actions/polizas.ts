"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface CreatePolizaData {
  numero: string
  compania_id: number
  cliente_id: number
  fecha_vigencia: string | null
}

export interface UpdatePolizaData {
  numero?: string
  compania_id?: number
  fecha_vigencia?: string | null
}

export async function createPoliza(data: CreatePolizaData) {
  console.log("🚀 [SERVER] Iniciando createPoliza con datos:", data)

  try {

    // Validar que la compañía existe
    console.log("🔍 [SERVER] Validando compañía ID:", data.compania_id)
    const { data: compania, error: companiaError } = await supabase
      .from("companias")
      .select("id, nombre")
      .eq("id", data.compania_id)
      .single()

    if (companiaError || !compania) {
      console.error("❌ [SERVER] Compañía no encontrada:", companiaError)
      return {
        success: false,
        error: `La compañía seleccionada no existe`,
      }
    }

    console.log("✅ [SERVER] Compañía validada:", compania)

    // Validar que el cliente existe
    console.log("🔍 [SERVER] Validando cliente ID:", data.cliente_id)
    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .select("id")
      .eq("id", data.cliente_id)
      .single()

    if (clienteError || !cliente) {
      console.error("❌ [SERVER] Cliente no encontrado:", clienteError)
      return {
        success: false,
        error: `El cliente no existe`,
      }
    }

    console.log("✅ [SERVER] Cliente validado")

    // Crear póliza
    console.log("💾 [SERVER] Insertando póliza...")
    const { data: poliza, error } = await supabase
      .from("polizas")
      .insert({
        numero: data.numero,
        compania_id: data.compania_id,
        cliente_id: data.cliente_id,
        fecha_vigencia: data.fecha_vigencia,
      })
      .select(`
        *,
        compania:companias(id, nombre)
      `)
      .single()

    if (error) {
      console.error("❌ [SERVER] Error al crear póliza:", error)
      return {
        success: false,
        error: `Error al crear póliza: ${error.message}`,
      }
    }

    console.log("✅ [SERVER] Póliza creada exitosamente:", poliza)
    console.log("🔄 [SERVER] Revalidando rutas...")

    revalidatePath("/")
    revalidatePath("/clientes")

    return {
      success: true,
      data: poliza,
    }
  } catch (error) {
    console.error("❌ [SERVER] Error inesperado en createPoliza:", error)
    return {
      success: false,
      error: "Error interno del servidor",
    }
  }
}

export async function getPolizasByClienteId(clienteId: number) {
  console.log(`📋 [SERVER] Obteniendo pólizas para cliente ID: ${clienteId}`)

  try {

    const { data, error } = await supabase
      .from("polizas")
      .select(`
        *,
        compania:companias(id, nombre)
      `)
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ [SERVER] Error al obtener pólizas:", error)
      return {
        success: false,
        error: `Error al obtener pólizas: ${error.message}`,
        data: [],
      }
    }

    console.log(`✅ [SERVER] ${data?.length || 0} pólizas obtenidas`)
    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (error) {
    console.error("❌ [SERVER] Error inesperado al obtener pólizas:", error)
    return {
      success: false,
      error: "Error interno del servidor",
      data: [],
    }
  }
}

export async function updatePoliza(id: number, data: UpdatePolizaData) {
  console.log(`🔄 [SERVER] Actualizando póliza ID ${id} con datos:`, data)

  try {

    // Si se está actualizando la compañía, validar que existe
    if (data.compania_id) {
      console.log("🔍 [SERVER] Validando nueva compañía ID:", data.compania_id)
      const { data: compania, error: companiaError } = await supabase
        .from("companias")
        .select("id, nombre")
        .eq("id", data.compania_id)
        .single()

      if (companiaError || !compania) {
        console.error("❌ [SERVER] Compañía no encontrada:", companiaError)
        return {
          success: false,
          error: `La compañía seleccionada no existe`,
        }
      }

      console.log("✅ [SERVER] Nueva compañía validada:", compania)
    }

    console.log("💾 [SERVER] Actualizando póliza...")
    const { data: poliza, error } = await supabase
      .from("polizas")
      .update(data)
      .eq("id", id)
      .select(`
        *,
        compania:companias(id, nombre)
      `)
      .single()

    if (error) {
      console.error("❌ [SERVER] Error al actualizar póliza:", error)
      return {
        success: false,
        error: `Error al actualizar póliza: ${error.message}`,
      }
    }

    console.log("✅ [SERVER] Póliza actualizada exitosamente:", poliza)
    console.log("🔄 [SERVER] Revalidando rutas...")

    revalidatePath("/")
    revalidatePath("/clientes")

    return {
      success: true,
      data: poliza,
    }
  } catch (error) {
    console.error("❌ [SERVER] Error inesperado al actualizar póliza:", error)
    return {
      success: false,
      error: "Error interno del servidor",
    }
  }
}

export async function deletePoliza(id: number) {
  console.log(`🗑️ [SERVER] Eliminando póliza ID: ${id}`)

  try {

    const { error } = await supabase.from("polizas").delete().eq("id", id)

    if (error) {
      console.error("❌ [SERVER] Error al eliminar póliza:", error)
      return {
        success: false,
        error: `Error al eliminar póliza: ${error.message}`,
      }
    }

    console.log("✅ [SERVER] Póliza eliminada exitosamente")
    console.log("🔄 [SERVER] Revalidando rutas...")

    revalidatePath("/")
    revalidatePath("/clientes")

    return {
      success: true,
    }
  } catch (error) {
    console.error("❌ [SERVER] Error inesperado al eliminar póliza:", error)
    return {
      success: false,
      error: "Error interno del servidor",
    }
  }
}

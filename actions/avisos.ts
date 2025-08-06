"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getAvisos() {
  try {
    // Primero actualizar los avisos automáticamente
    await supabase.rpc("actualizar_avisos_automaticos")

    // Luego obtener los avisos usando la vista
    const { data, error } = await supabase
      .from("avisos_proximos")
      .select("*")
      .order("dias_restantes", { ascending: true })

    if (error) {
      console.error("Error fetching avisos:", error)
      return { success: false, error: error.message, data: [] }
    }

    // Transformar los datos para que coincidan con la estructura esperada
    const avisosTransformados = (data || []).map((aviso: any) => ({
      id: aviso.id,
      estado: aviso.estado,
      fecha_vencimiento_calculado: aviso.fecha_vencimiento_calculado,
      ultimo_pago: aviso.ultimo_pago,
      dias_restantes: aviso.dias_restantes,
      poliza: {
        id: aviso.poliza_id,
        numero: aviso.poliza_numero,
        fecha_vencimiento: aviso.fecha_vencimiento_calculado, // Para compatibilidad
        cliente: {
          id: aviso.cliente_id,
          apellido: aviso.apellido,
          nombre: aviso.nombre,
        },
        compania: {
          id: aviso.compania_id,
          nombre: aviso.compania_nombre,
        },
      },
    }))

    return { success: true, data: avisosTransformados }
  } catch (error) {
    console.error("Error in getAvisos:", error)
    return { success: false, error: "Error interno del servidor", data: [] }
  }
}

export async function updateAvisoEstado(avisoId: number, nuevoEstado: "por_vencer" | "avisado" | "pagado") {
  try {
    if (nuevoEstado === "pagado") {
      // Usar la función especial para marcar pago
      const { error } = await supabase.rpc("marcar_pago_poliza", { aviso_id: avisoId })

      if (error) {
        console.error("Error marking payment:", error)
        return { success: false, error: error.message, data: null }
      }
    } else {
      // Actualización normal para otros estados
      const { error } = await supabase.from("avisos").update({ estado: nuevoEstado }).eq("id", avisoId)

      if (error) {
        console.error("Error updating aviso:", error)
        return { success: false, error: error.message, data: null }
      }
    }

    revalidatePath("/avisos")
    return { success: true, data: null }
  } catch (error) {
    console.error("Error in updateAvisoEstado:", error)
    return { success: false, error: "Error interno del servidor", data: null }
  }
}

export async function createAviso(polizaId: number) {
  try {
    // Los avisos se crean automáticamente por triggers,
    // pero podemos forzar la actualización
    await supabase.rpc("actualizar_avisos_automaticos")

    revalidatePath("/avisos")
    return { success: true, data: null }
  } catch (error) {
    console.error("Error in createAviso:", error)
    return { success: false, error: "Error interno del servidor", data: null }
  }
}

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

export async function updateAvisoEstado(
  avisoId: number,
  nuevoEstado: "por_vencer" | "avisado" | "pagado",
  userName: string // 1. Añadimos el nombre de usuario como parámetro
) {
  try {
    let updateData: any = { estado: nuevoEstado };

    // 2. Si el nuevo estado es "avisado", guardamos el nombre del usuario y la fecha
    if (nuevoEstado === "avisado") {
      updateData.avisado_por = userName;
      updateData.fecha_aviso = new Date().toISOString();
    }

    // 3. Si se devuelve a "por vencer", limpiamos el campo
    if (nuevoEstado === "por_vencer") {
      updateData.avisado_por = null;
      updateData.fecha_aviso = null;
    }

    if (nuevoEstado === "pagado") {
      const { error } = await supabase.rpc("marcar_pago_poliza", { aviso_id: avisoId });
      if (error) {
        console.error("Error marking payment:", error);
        return { success: false, error: error.message };
      }
    } else {
      const { error } = await supabase
        .from("avisos")
        .update(updateData)
        .eq("id", avisoId);

      if (error) {
        console.error("Error updating aviso:", error);
        return { success: false, error: error.message };
      }
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error in updateAvisoEstado:", error);
    return { success: false, error: "Error interno del servidor" };
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

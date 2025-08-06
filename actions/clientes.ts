"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface CreateClienteData {
  apellido: string
  nombre: string
  telefono?: string
  email?: string
  localidad?: string
  polizas?: Array<{
    numero: string
    compania_id: number
    fecha_vigencia: string
  }>
}

export interface UpdateClienteData {
  apellido?: string
  nombre?: string
  contacto?: string
  email?: string
  localidad?: string
}

export async function getClientes() {
  try {
    console.log("🔍 Iniciando getClientes...")
    const { data, error } = await supabase.from("clientes").select("*").order("apellido", { ascending: true })

    if (error) {
      console.error("❌ Error fetching clientes:", error)

      // Mensaje más específico para diferentes tipos de errores
      if (error.message.includes("does not exist") || error.message.includes("relation")) {
        return {
          success: false,
          error:
            "Las tablas de la base de datos no existen. Necesitas ejecutar los scripts de configuración en Supabase.",
          data: [],
        }
      }

      if (error.message.includes("permission") || error.message.includes("access")) {
        return {
          success: false,
          error: "Error de permisos. Verifica la configuración de Supabase y las políticas RLS.",
          data: [],
        }
      }

      return { success: false, error: `Error de base de datos: ${error.message}`, data: [] }
    }

    console.log("✅ Clientes obtenidos exitosamente:", data?.length || 0, "registros")
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("❌ Error in getClientes:", error)
    return {
      success: false,
      error: "Error de conexión. Verifica que Supabase esté configurado correctamente.",
      data: [],
    }
  }
}

export async function getClienteById(id: number) {
  try {
    console.log("🔍 Obteniendo cliente por ID:", id)
    const { data, error } = await supabase
      .from("clientes")
      .select(`
        *,
        polizas (
          *,
          compania:companias (*)
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("❌ Error fetching cliente:", error)
      return { success: false, error: error.message, data: null }
    }

    console.log("✅ Cliente obtenido exitosamente:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Error in getClienteById:", error)
    return { success: false, error: "Error interno del servidor", data: null }
  }
}

export async function createCliente(data: CreateClienteData) {
  console.log("🚀 [SERVER] Iniciando createCliente con datos:", data)

  try {

    // Validar datos requeridos
    if (!data.apellido?.trim() || !data.nombre?.trim()) {
      console.error("❌ [SERVER] Validación fallida: apellido y nombre son requeridos")
      return {
        success: false,
        error: "El apellido y nombre son obligatorios",
      }
    }

    console.log("📝 [SERVER] Preparando datos del cliente...")

    // Preparar datos del cliente
    const clienteData = {
      apellido: data.apellido.trim(),
      nombre: data.nombre.trim(),
      telefono: data.telefono?.trim() || null,
      email: data.email?.trim() || null,
      localidad: data.localidad?.trim() || null,
    }

    console.log("💾 [SERVER] Insertando cliente en la base de datos:", clienteData)

    // Insertar cliente
    const { data: cliente, error: clienteError } = await supabase.from("clientes").insert(clienteData).select().single()

    if (clienteError) {
      console.error("❌ [SERVER] Error al insertar cliente:", clienteError)
      return {
        success: false,
        error: `Error al crear cliente: ${clienteError.message}`,
      }
    }

    console.log("✅ [SERVER] Cliente creado exitosamente:", cliente)

    // Si hay pólizas, crearlas
    if (data.polizas && data.polizas.length > 0) {
      console.log(`📋 [SERVER] Procesando ${data.polizas.length} pólizas...`)

      for (let i = 0; i < data.polizas.length; i++) {
        const poliza = data.polizas[i]
        console.log(`📋 [SERVER] Procesando póliza ${i + 1}/${data.polizas.length}:`, poliza)

        // Validar que la compañía existe
        const { data: compania, error: companiaError } = await supabase
          .from("companias")
          .select("id")
          .eq("id", poliza.compania_id)
          .single()

        if (companiaError || !compania) {
          console.error(`❌ [SERVER] Compañía no encontrada para ID ${poliza.compania_id}:`, companiaError)
          continue // Saltar esta póliza si la compañía no existe
        }

        console.log(`✅ [SERVER] Compañía validada para póliza ${i + 1}`)

        // Insertar póliza
        const polizaData = {
          numero: poliza.numero,
          compania_id: poliza.compania_id,
          cliente_id: cliente.id,
          fecha_vigencia: poliza.fecha_vigencia,
        }

        console.log(`💾 [SERVER] Insertando póliza ${i + 1}:`, polizaData)

        const { error: polizaError } = await supabase.from("polizas").insert(polizaData)

        if (polizaError) {
          console.error(`❌ [SERVER] Error al insertar póliza ${i + 1}:`, polizaError)
        } else {
          console.log(`✅ [SERVER] Póliza ${i + 1} creada exitosamente`)
        }
      }
    }

    console.log("🔄 [SERVER] Revalidando rutas...")
    revalidatePath("/")
    revalidatePath("/clientes")

    console.log("🎉 [SERVER] Proceso completado exitosamente")
    return {
      success: true,
      data: cliente,
    }
  } catch (error) {
    console.error("❌ [SERVER] Error inesperado en createCliente:", error)
    return {
      success: false,
      error: "Error interno del servidor",
    }
  }
}

export async function updateCliente(id: number, data: UpdateClienteData) {
  console.log(`🔄 [SERVER] Actualizando cliente ID ${id} con datos:`, data)

  try {

    // Preparar datos para actualización
    const updateData: any = {}

    if (data.apellido !== undefined) updateData.apellido = data.apellido
    if (data.nombre !== undefined) updateData.nombre = data.nombre
    if (data.contacto !== undefined) updateData.telefono = data.contacto
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.localidad !== undefined) updateData.localidad = data.localidad

    console.log("💾 [SERVER] Datos preparados para actualización:", updateData)

    const { data: cliente, error } = await supabase.from("clientes").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("❌ [SERVER] Error al actualizar cliente:", error)
      return {
        success: false,
        error: `Error al actualizar cliente: ${error.message}`,
      }
    }

    console.log("✅ [SERVER] Cliente actualizado exitosamente:", cliente)
    console.log("🔄 [SERVER] Revalidando rutas...")

    revalidatePath("/")
    revalidatePath("/clientes")

    return {
      success: true,
      data: cliente,
    }
  } catch (error) {
    console.error("❌ [SERVER] Error inesperado al actualizar cliente:", error)
    return {
      success: false,
      error: "Error interno del servidor",
    }
  }
}

export async function deleteCliente(id: number) {
  console.log(`🗑️ [SERVER] Eliminando cliente ID: ${id}`)

  try {

    // Primero eliminar las pólizas asociadas
    console.log("🗑️ [SERVER] Eliminando pólizas asociadas...")
    const { error: polizasError } = await supabase.from("polizas").delete().eq("cliente_id", id)

    if (polizasError) {
      console.error("❌ [SERVER] Error al eliminar pólizas:", polizasError)
      return {
        success: false,
        error: `Error al eliminar pólizas: ${polizasError.message}`,
      }
    }

    console.log("✅ [SERVER] Pólizas eliminadas exitosamente")

    // Luego eliminar el cliente
    console.log("🗑️ [SERVER] Eliminando cliente...")
    const { error: clienteError } = await supabase.from("clientes").delete().eq("id", id)

    if (clienteError) {
      console.error("❌ [SERVER] Error al eliminar cliente:", clienteError)
      return {
        success: false,
        error: `Error al eliminar cliente: ${clienteError.message}`,
      }
    }

    console.log("✅ [SERVER] Cliente eliminado exitosamente")
    console.log("🔄 [SERVER] Revalidando rutas...")

    revalidatePath("/")
    revalidatePath("/clientes")

    return {
      success: true,
    }
  } catch (error) {
    console.error("❌ [SERVER] Error inesperado al eliminar cliente:", error)
    return {
      success: false,
      error: "Error interno del servidor",
    }
  }
}

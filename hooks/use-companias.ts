"use client"

import { useState, useEffect } from "react"
import { getCompanias } from "@/actions/companias"

interface Compania {
  id: number
  nombre: string
}

export function useCompanias() {
  const [companias, setCompanias] = useState<Compania[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCompanias = async () => {
      console.log("🏢 Cargando compañías...")
      setIsLoading(true)
      setError(null)

      try {
        const result = await getCompanias()
        if (result.success) {
          console.log("✅ Compañías cargadas exitosamente:", result.data.length, "registros")
          setCompanias(result.data)
        } else {
          console.error("❌ Error al cargar compañías:", result.error)
          setError(result.error)
        }
      } catch (err) {
        console.error("❌ Error inesperado al cargar compañías:", err)
        setError("Error al cargar compañías")
      } finally {
        setIsLoading(false)
      }
    }

    loadCompanias()
  }, [])

  return { companias, isLoading, error }
}

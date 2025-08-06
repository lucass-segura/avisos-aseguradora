import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para normalizar texto removiendo acentos y convirtiendo a minúsculas
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

// Función para buscar texto ignorando acentos
export function searchIgnoreAccents(searchTerm: string, targetText: string): boolean {
  const normalizedSearch = normalizeText(searchTerm)
  const normalizedTarget = normalizeText(targetText)
  return normalizedTarget.includes(normalizedSearch)
}

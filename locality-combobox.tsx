"\"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn, searchIgnoreAccents } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { localidadesArgentina } from "@/data/localidades-argentina"

interface LocalityComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function LocalityCombobox({
  value,
  onChange,
  placeholder = "Seleccionar localidad...",
  className,
}: LocalityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Filtrar localidades basado en la búsqueda (ignorando acentos)
  const filteredLocalidades = localidadesArgentina.filter((localidad) => searchIgnoreAccents(searchValue, localidad))

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? "" : selectedValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar localidad..." value={searchValue} onValueChange={setSearchValue} />
          <CommandList>
            <CommandEmpty>No se encontró la localidad.</CommandEmpty>
            <CommandGroup>
              {filteredLocalidades.slice(0, 50).map((localidad) => (
                <CommandItem key={localidad} value={localidad} onSelect={() => handleSelect(localidad)}>
                  <Check className={cn("mr-2 h-4 w-4", value === localidad ? "opacity-100" : "opacity-0")} />
                  {localidad}
                </CommandItem>
              ))}
              {filteredLocalidades.length > 50 && (
                <CommandItem disabled>
                  <span className="text-sm text-gray-500">
                    Y {filteredLocalidades.length - 50} más... Refina tu búsqueda
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

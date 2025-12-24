"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, X } from "lucide-react"

interface Customer {
  id: string
  name: string
  phone?: string
}

interface CustomerSearchProps {
  companyId: string
  onSelect: (customer: Customer) => void
  onCreateNew?: (name: string) => void
  placeholder?: string
  disabled?: boolean
  preselectedCustomerId?: string
  onFocus?: () => void
  onBlur?: () => void
}

export function CustomerSearch({ 
  companyId, 
  onSelect, 
  onCreateNew, 
  placeholder = "Buscar cliente...",
  disabled = false,
  preselectedCustomerId,
  onFocus,
  onBlur
}: CustomerSearchProps) {
  const [search, setSearch] = useState("")
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Función para recargar clientes
  const fetchAllCustomers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/customers`)
      if (res.ok) {
        const data = await res.json()
        // Ordenar alfabéticamente
        const sorted = data.sort((a: Customer, b: Customer) => 
          a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
        )
        setAllCustomers(sorted)
        setFilteredCustomers(sorted)
        
        // Si hay un cliente pre-seleccionado, seleccionarlo automáticamente
        if (preselectedCustomerId) {
          const preselected = sorted.find((c: Customer) => c.id === preselectedCustomerId)
          if (preselected) {
            setSelectedCustomer(preselected)
            setSearch(preselected.name)
            onSelect(preselected)
          }
        }
      }
    } catch (error) {
      console.error("Error cargando clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar todos los clientes al montar el componente
  useEffect(() => {
    if (companyId) {
      fetchAllCustomers()
    }
  }, [companyId, preselectedCustomerId, onSelect])

  // Filtrar clientes localmente cuando el usuario escribe
  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredCustomers(allCustomers)
    } else {
      const searchLower = search.toLowerCase()
      const filtered = allCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(searchLower))
      )
      setFilteredCustomers(filtered)
    }
  }, [search, allCustomers])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    onSelect(customer)
    setSearch(customer.name)
    setShowResults(false)
  }

  const handleCreateNew = async () => {
    if (onCreateNew && search.trim()) {
      setLoading(true)
      try {
        await onCreateNew(search.trim())
        await fetchAllCustomers()
      } catch (error) {
        console.error("Error creando cliente:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    setSelectedCustomer(null)
    setShowResults(true)
  }

  const handleInputFocus = () => {
    setShowResults(true)
    onFocus?.()
  }

  const handleInputBlur = () => {
    // Delay para permitir que el click en un item se procese primero
    setTimeout(() => {
      onBlur?.()
    }, 200)
  }

  const handleClear = () => {
    setSelectedCustomer(null)
    setSearch("")
    setShowResults(false)
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={search}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          className={selectedCustomer ? "bg-green-50 border-green-300 pr-10" : ""}
        />
        {selectedCustomer && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Limpiar selección"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Buscando...
            </div>
          )}
          
          {!loading && filteredCustomers.length > 0 && (
            <div className="max-h-60 overflow-auto">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => handleSelect(customer)}
                >
                  <div className="font-medium">{customer.name}</div>
                  {customer.phone && (
                    <div className="text-xs text-muted-foreground">{customer.phone}</div>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {!loading && filteredCustomers.length === 0 && search.length >= 1 && (
            <div className="p-2">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={handleCreateNew}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear nuevo: &quot;{search}&quot;
              </Button>
            </div>
          )}

          {!loading && filteredCustomers.length === 0 && search.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No hay clientes disponibles
            </div>
          )}
        </div>
      )}
      
      {selectedCustomer && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-sm">
          ✓ Cliente seleccionado: <strong>{selectedCustomer.name}</strong>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"

interface Product {
  id: string
  name: string
  nameLower: string
}

interface ProductSearchProps {
  companyId: string
  onSelect: (product: Product) => void
  onCreateNew?: (name: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ProductSearch({ 
  companyId, 
  onSelect, 
  onCreateNew, 
  placeholder = "Buscar producto...",
  disabled = false
}: ProductSearchProps) {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebounce(search, 300)

  // Buscar productos cuando el usuario escribe
  useEffect(() => {
    if (debouncedSearch.length < 1) {
      setProducts([])
      setShowResults(false)
      return
    }

    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/companies/${companyId}/products/search?q=${encodeURIComponent(debouncedSearch)}`
        )
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
          // Mostrar resultados si hay búsqueda activa
          if (debouncedSearch.length >= 1) {
            setShowResults(true)
          }
        }
      } catch (error) {
        console.error("Error buscando productos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [debouncedSearch, companyId])

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

  const handleSelect = (product: Product) => {
    setSelectedProduct(product)
    onSelect(product)
    setSearch(product.name)
    setShowResults(false)
  }

  const handleCreateNew = () => {
    if (onCreateNew && search.trim()) {
      onCreateNew(search.trim())
      setSearch("")
      setShowResults(false)
      setSelectedProduct(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    setSelectedProduct(null)
    if (value.length >= 1) {
      setShowResults(true)
    }
  }

  const handleInputFocus = () => {
    if (search.length >= 1 || products.length > 0) {
      setShowResults(true)
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        placeholder={placeholder}
        value={search}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        disabled={disabled}
        className={selectedProduct ? "bg-green-50 border-green-300" : ""}
      />
      
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Buscando...
            </div>
          )}
          
          {!loading && products.length > 0 && (
            <div>
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => handleSelect(product)}
                >
                  {product.name}
                </button>
              ))}
            </div>
          )}
          
          {!loading && products.length === 0 && search.length >= 1 && (
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
        </div>
      )}
      
      {selectedProduct && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-sm">
          ✓ Producto seleccionado: <strong>{selectedProduct.name}</strong>
        </div>
      )}
    </div>
  )
}


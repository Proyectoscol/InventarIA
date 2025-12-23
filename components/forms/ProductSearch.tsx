"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, X } from "lucide-react"

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
  preselectedProductId?: string
}

export function ProductSearch({ 
  companyId, 
  onSelect, 
  onCreateNew, 
  placeholder = "Buscar producto...",
  disabled = false,
  preselectedProductId
}: ProductSearchProps) {
  const [search, setSearch] = useState("")
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Función para recargar productos
  const fetchAllProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/products`)
      if (res.ok) {
        const data = await res.json()
        // Ordenar alfabéticamente
        const sorted = data.sort((a: Product, b: Product) => 
          a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
        )
        setAllProducts(sorted)
        setFilteredProducts(sorted)
        
        // Si hay un producto pre-seleccionado, seleccionarlo automáticamente
        if (preselectedProductId) {
          const preselected = sorted.find((p: Product) => p.id === preselectedProductId)
          if (preselected) {
            setSelectedProduct(preselected)
            setSearch(preselected.name)
            onSelect(preselected)
          }
        }
      }
    } catch (error) {
      console.error("Error cargando productos:", error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar todos los productos al montar el componente
  useEffect(() => {
    if (companyId) {
      fetchAllProducts()
    }
  }, [companyId, preselectedProductId, onSelect])

  // Filtrar productos localmente cuando el usuario escribe
  useEffect(() => {
    if (search.trim().length === 0) {
      // Si no hay búsqueda, mostrar todos los productos
      setFilteredProducts(allProducts)
    } else {
      // Filtrar productos que coincidan con la búsqueda
      const filtered = allProducts.filter(product =>
        product.nameLower.includes(search.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [search, allProducts])

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

  const handleCreateNew = async () => {
    if (onCreateNew && search.trim()) {
      setLoading(true)
      try {
        await onCreateNew(search.trim())
        // Recargar la lista de productos para incluir el nuevo
        await fetchAllProducts()
        // No limpiar el search ni cerrar resultados aquí
        // El componente padre manejará la selección del nuevo producto
      } catch (error) {
        console.error("Error creando producto:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    setSelectedProduct(null)
    // Siempre mostrar resultados cuando se escribe
    setShowResults(true)
  }

  const handleInputFocus = () => {
    // Mostrar todos los productos cuando se hace focus
    setShowResults(true)
  }

  const handleClear = () => {
    setSelectedProduct(null)
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
          disabled={disabled}
          className={selectedProduct ? "bg-green-50 border-green-300 pr-10" : ""}
        />
        {selectedProduct && (
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
          
          {!loading && filteredProducts.length > 0 && (
            <div className="max-h-60 overflow-auto">
              {filteredProducts.map((product) => (
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
          
          {!loading && filteredProducts.length === 0 && search.length >= 1 && (
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

          {!loading && filteredProducts.length === 0 && search.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No hay productos disponibles
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


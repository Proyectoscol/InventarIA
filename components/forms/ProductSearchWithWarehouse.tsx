"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, X, Warehouse } from "lucide-react"

interface ProductWithWarehouse {
  id: string
  name: string
  nameLower: string
  stock: Array<{
    warehouse: {
      id: string
      name: string
    }
    quantity: number
  }>
}

interface ProductSearchWithWarehouseProps {
  companyId: string
  onSelect: (product: ProductWithWarehouse, warehouseId: string) => void
  onCreateNew?: (name: string) => void
  placeholder?: string
  disabled?: boolean
  excludedProductIds?: string[] // Array de "productId-warehouseId" para excluir
}

export function ProductSearchWithWarehouse({ 
  companyId, 
  onSelect, 
  onCreateNew, 
  placeholder = "Buscar por producto o bodega...",
  disabled = false,
  excludedProductIds = []
}: ProductSearchWithWarehouseProps) {
  const [search, setSearch] = useState("")
  const [allProducts, setAllProducts] = useState<ProductWithWarehouse[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductWithWarehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Función para recargar productos
  const fetchAllProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/companies/${companyId}/products`)
      if (res.ok) {
        const data = await res.json()
        // Ordenar alfabéticamente
        const sorted = data.sort((a: ProductWithWarehouse, b: ProductWithWarehouse) => 
          a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
        )
        setAllProducts(sorted)
        setFilteredProducts(sorted)
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
  }, [companyId])

  // Filtrar productos localmente cuando el usuario escribe
  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredProducts(allProducts)
    } else {
      const searchLower = search.toLowerCase()
      const filtered = allProducts.filter(product => {
        // Buscar por nombre de producto
        if (product.nameLower.includes(searchLower)) {
          return true
        }
        // Buscar por nombre de bodega
        return product.stock.some(s => 
          s.warehouse.name.toLowerCase().includes(searchLower)
        )
      })
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

  const handleSelect = (product: ProductWithWarehouse, warehouseId: string) => {
    onSelect(product, warehouseId)
    setSearch("")
    setShowResults(false)
  }

  const handleCreateNew = async () => {
    if (onCreateNew && search.trim()) {
      setLoading(true)
      try {
        await onCreateNew(search.trim())
        await fetchAllProducts()
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
    setShowResults(true)
  }

  const handleInputFocus = () => {
    setShowResults(true)
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
        />
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
              {filteredProducts.map((product) => {
                // Si el producto tiene stock en múltiples bodegas, mostrar cada una
                if (product.stock.length > 0) {
                  return product.stock.map((stockItem) => {
                    const productKey = `${product.id}-${stockItem.warehouse.id}`
                    const isExcluded = excludedProductIds.includes(productKey)
                    
                    if (isExcluded) {
                      return null // No mostrar productos ya agregados
                    }
                    
                    return (
                    <button
                      key={productKey}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-b-0"
                      onClick={() => handleSelect(product, stockItem.warehouse.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Warehouse className="h-3 w-3" />
                            {stockItem.warehouse.name} • Stock: {stockItem.quantity}
                          </div>
                        </div>
                      </div>
                    </button>
                    )
                  }).filter(Boolean) // Filtrar nulls
                } else {
                  // Producto sin stock en ninguna bodega
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-b-0 opacity-50"
                      disabled
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Sin stock disponible
                      </div>
                    </button>
                  )
                }
              })}
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
    </div>
  )
}


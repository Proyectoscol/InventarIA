"use client"

import { useState, useEffect } from "react"

interface Product {
  id: string
  name: string
  nameLower: string
  stock?: Array<{ quantity: number; warehouseId: string }>
}

export function useProducts(companyId: string | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!companyId) {
      setLoading(false)
      return
    }
    
    fetchProducts()
  }, [companyId])
  
  const fetchProducts = async () => {
    if (!companyId) return
    
    try {
      setLoading(true)
      const res = await fetch(`/api/companies/${companyId}/products`)
      if (!res.ok) throw new Error("Error cargando productos")
      const data = await res.json()
      setProducts(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const searchProducts = async (query: string): Promise<Product[]> => {
    if (!companyId || query.length < 2) return []
    
    try {
      const res = await fetch(
        `/api/companies/${companyId}/products/search?q=${encodeURIComponent(query)}`
      )
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }
  
  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    searchProducts
  }
}


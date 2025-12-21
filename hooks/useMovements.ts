"use client"

import { useState, useEffect } from "react"

interface Movement {
  id: string
  movementNumber: string
  type: "purchase" | "sale"
  product: { name: string }
  warehouse: { name: string }
  quantity: number
  totalAmount: number
  profit?: number
  movementDate: Date
}

export function useMovements(companyId: string | null, filters?: {
  type?: string
  from?: Date
  to?: Date
  warehouseId?: string
  productId?: string
}) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!companyId) {
      setLoading(false)
      return
    }
    
    fetchMovements()
  }, [companyId, filters])
  
  const fetchMovements = async () => {
    if (!companyId) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        companyId
      })
      
      if (filters?.type) params.append("type", filters.type)
      if (filters?.from) params.append("from", filters.from.toISOString())
      if (filters?.to) params.append("to", filters.to.toISOString())
      if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId)
      if (filters?.productId) params.append("productId", filters.productId)
      
      const res = await fetch(`/api/movements?${params}`)
      if (!res.ok) throw new Error("Error cargando movimientos")
      const data = await res.json()
      setMovements(data.movements || data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return {
    movements,
    loading,
    error,
    refetch: fetchMovements
  }
}


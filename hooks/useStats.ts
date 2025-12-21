"use client"

import { useState, useEffect } from "react"

interface Stats {
  sales: {
    totalAmount: number
    cashAmount: number
    pendingCredit: number
    count: number
  }
  profit: {
    totalRevenue: number
    totalCost: number
    netProfit: number
    margin: number
    topProducts: Array<{
      productName: string
      profit: number
      quantity: number
    }>
  }
}

export function useStats(
  companyId: string | null,
  dateRange?: { from: Date; to: Date }
) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!companyId) {
      setLoading(false)
      return
    }
    
    fetchStats()
  }, [companyId, dateRange])
  
  const fetchStats = async () => {
    if (!companyId) return
    
    try {
      setLoading(true)
      const from = dateRange?.from || new Date(new Date().setMonth(new Date().getMonth() - 1))
      const to = dateRange?.to || new Date()
      
      const params = new URLSearchParams({
        companyId,
        from: from.toISOString(),
        to: to.toISOString()
      })
      
      const [sales, profit] = await Promise.all([
        fetch(`/api/reports/sales?${params}`).then(r => r.json()),
        fetch(`/api/reports/profit?${params}`).then(r => r.json())
      ])
      
      setStats({ sales, profit })
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}


"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

interface InventoryRotationProps {
  companyId: string
}

export function InventoryRotation({ companyId }: InventoryRotationProps) {
  const [rotation, setRotation] = useState<{
    lowRotation: Array<{
      name: string
      days_since_sale: number
      current_stock: number
    }>
    highRotation: Array<{
      name: string
      total_sales: number
      avg_days_between_sales: number
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRotation()
  }, [companyId])

  const fetchRotation = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/reports/inventory-rotation?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setRotation(data)
      }
    } catch (error) {
      console.error("Error cargando rotación:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rotación de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔄 Rotación de Inventario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-sm">🐌 Baja Rotación</h4>
            <div className="space-y-1">
              {rotation?.lowRotation.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-sm p-2 bg-muted rounded">
                  <span className="font-medium">{item.name}</span>
                  <p className="text-xs text-muted-foreground">
                    {item.days_since_sale || "Nunca"} días sin venta • Stock: {item.current_stock}
                  </p>
                </div>
              ))}
              {(!rotation?.lowRotation || rotation.lowRotation.length === 0) && (
                <p className="text-xs text-muted-foreground">No hay productos de baja rotación</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-sm">⚡ Alta Rotación</h4>
            <div className="space-y-1">
              {rotation?.highRotation.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-sm p-2 bg-muted rounded">
                  <span className="font-medium">{item.name}</span>
                  <p className="text-xs text-muted-foreground">
                    {item.total_sales} ventas • Promedio: {item.avg_days_between_sales.toFixed(1)} días
                  </p>
                </div>
              ))}
              {(!rotation?.highRotation || rotation.highRotation.length === 0) && (
                <p className="text-xs text-muted-foreground">No hay datos de alta rotación</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


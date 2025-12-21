"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface TopProductsProps {
  products: Array<{
    productName: string
    profit: number
    quantity: number
  }>
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Top Productos por Ganancia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {products.slice(0, 5).map((product, idx) => (
            <div 
              key={idx} 
              className="flex justify-between items-center p-2 border rounded"
            >
              <div>
                <span className="font-medium">{idx + 1}. {product.productName}</span>
                <p className="text-xs text-muted-foreground">
                  {product.quantity} unidades vendidas
                </p>
              </div>
              <span className="font-bold text-green-600">
                {formatCurrency(product.profit)}
              </span>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay datos disponibles
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StockIndicator } from "./StockIndicator"
import { LowStockBadge } from "./LowStockBadge"
import { Edit, Trash2 } from "lucide-react"
import { Product } from "@/types"

interface ProductCardProps {
  product: Product
  onEdit?: (product: Product) => void
  onDelete?: (productId: string) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const totalStock = product.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{product.name}</CardTitle>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(product)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(product.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {product.imageBase64 && (
          <img
            src={product.imageBase64}
            alt={product.name}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        
        {product.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {product.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Stock Total:</span>
            <span className="text-sm font-bold">{totalStock} unidades</span>
          </div>
          
          {product.stock && product.stock.length > 0 && (
            <div className="space-y-1">
              {product.stock.map((s) => (
                <StockIndicator
                  key={s.id}
                  warehouseName={s.warehouse?.name || "Desconocida"}
                  quantity={s.quantity}
                  threshold={product.minStockThreshold}
                />
              ))}
            </div>
          )}
          
          <LowStockBadge
            currentStock={totalStock}
            threshold={product.minStockThreshold}
          />
        </div>
      </CardContent>
    </Card>
  )
}


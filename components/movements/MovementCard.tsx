"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, RotateCcw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Movement } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface MovementCardProps {
  movement: Movement
  onEdit?: (movement: Movement) => void
  onReturn?: (movement: Movement) => void
}

export function MovementCard({ movement, onEdit, onReturn }: MovementCardProps) {
  const isSale = movement.type === "sale"
  const isPurchase = movement.type === "purchase"
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                {movement.movementNumber}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                isSale 
                  ? "bg-green-100 text-green-800" 
                  : "bg-blue-100 text-blue-800"
              }`}>
                {isSale ? "VENTA" : "COMPRA"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(movement.movementDate), "PPP 'a las' HH:mm", { locale: es })}
            </p>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(movement)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onReturn && isSale && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onReturn(movement)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium">Producto: </span>
            <span className="text-sm">{movement.product?.name || "N/A"}</span>
          </div>
          
          <div>
            <span className="text-sm font-medium">Bodega: </span>
            <span className="text-sm">{movement.warehouse?.name || "N/A"}</span>
          </div>
          
          <div>
            <span className="text-sm font-medium">Cantidad: </span>
            <span className="text-sm">{movement.quantity} unidades</span>
          </div>
          
          <div>
            <span className="text-sm font-medium">Total: </span>
            <span className="text-sm font-bold">
              {formatCurrency(Number(movement.totalAmount))}
            </span>
          </div>
          
          {isSale && movement.profit !== undefined && (
            <div>
              <span className="text-sm font-medium">Ganancia: </span>
              <span className="text-sm font-bold text-green-600">
                {formatCurrency(Number(movement.profit))}
              </span>
            </div>
          )}
          
          {movement.customer && (
            <div>
              <span className="text-sm font-medium">Cliente: </span>
              <span className="text-sm">{movement.customer.name}</span>
            </div>
          )}
          
          {movement.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">{movement.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


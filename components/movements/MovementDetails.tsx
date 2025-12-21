"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Movement } from "@/types"

interface MovementDetailsProps {
  movement: Movement
}

export function MovementDetails({ movement }: MovementDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles del Movimiento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Número</p>
            <p className="font-mono">{movement.movementNumber}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Tipo</p>
            <p className="font-medium">
              {movement.type === "sale" ? "Venta" : "Compra"}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Fecha</p>
            <p>
              {format(new Date(movement.movementDate), "PPP 'a las' HH:mm", { locale: es })}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Producto</p>
            <p className="font-medium">{movement.product?.name || "N/A"}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Bodega</p>
            <p>{movement.warehouse?.name || "N/A"}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Cantidad</p>
            <p className="font-medium">{movement.quantity} unidades</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Precio Unitario</p>
            <p>{formatCurrency(Number(movement.unitPrice))}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-bold text-lg">
              {formatCurrency(Number(movement.totalAmount))}
            </p>
          </div>
          
          {movement.type === "sale" && movement.profit !== undefined && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Costo Unitario</p>
                <p>{formatCurrency(Number(movement.unitCost || 0))}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Ganancia</p>
                <p className="font-bold text-lg text-green-600">
                  {formatCurrency(Number(movement.profit))}
                </p>
              </div>
            </>
          )}
          
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Pago</p>
            <p>
              {movement.paymentType === "cash" && "Efectivo"}
              {movement.paymentType === "credit" && "Crédito"}
              {movement.paymentType === "mixed" && "Mixto"}
            </p>
          </div>
          
          {movement.cashAmount && (
            <div>
              <p className="text-sm text-muted-foreground">Efectivo</p>
              <p>{formatCurrency(Number(movement.cashAmount))}</p>
            </div>
          )}
          
          {movement.creditAmount && (
            <div>
              <p className="text-sm text-muted-foreground">Crédito</p>
              <p>
                {formatCurrency(Number(movement.creditAmount))}
                {!movement.creditPaid && (
                  <span className="ml-2 text-xs text-orange-600">(Pendiente)</span>
                )}
              </p>
            </div>
          )}
          
          {movement.hasShipping && movement.shippingCost && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Costo de Envío</p>
                <p>{formatCurrency(Number(movement.shippingCost))}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Pagado por</p>
                <p>
                  {movement.shippingPaidBy === "customer" ? "Cliente" : "Vendedor"}
                </p>
              </div>
            </>
          )}
          
          {movement.customer && (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{movement.customer.name}</p>
              {movement.customer.email && (
                <p className="text-sm text-muted-foreground">{movement.customer.email}</p>
              )}
            </div>
          )}
          
          {movement.notes && (
            <div className="col-span-2 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Notas</p>
              <p className="text-sm">{movement.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


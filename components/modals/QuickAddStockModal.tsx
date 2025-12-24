"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/shared/CurrencyInput"
import { X, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

interface QuickAddStockModalProps {
  companyId: string
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  initialQuantity?: number
  onSuccess: () => void
  onCancel: () => void
}

export function QuickAddStockModal({
  companyId,
  productId,
  productName,
  warehouseId,
  warehouseName,
  initialQuantity,
  onSuccess,
  onCancel
}: QuickAddStockModalProps) {
  const [quantity, setQuantity] = useState<number>(initialQuantity || 1)
  const [price, setPrice] = useState<number>(0)
  const [priceType, setPriceType] = useState<"unit" | "total">("unit")
  const [loading, setLoading] = useState(false)
  const [lastCost, setLastCost] = useState<number | null>(null)

  // Obtener último costo unitario
  useEffect(() => {
    fetch(`/api/products/${productId}/last-purchase?warehouseId=${warehouseId}`)
      .then(res => res.json())
      .then(data => {
        if (data.lastPurchasePrice) {
          setLastCost(data.lastPurchasePrice)
          if (!price || price === 0) {
            setPrice(data.lastPurchasePrice)
          }
        }
      })
      .catch(() => {})
  }, [productId, warehouseId, price])

  const unitPrice = priceType === "unit" ? price : (quantity > 0 ? price / quantity : 0)
  const totalPrice = priceType === "unit" ? (price * quantity) : price

  const handleSubmit = async () => {
    if (quantity <= 0) {
      toast.error("❌ La cantidad debe ser mayor a 0")
      return
    }
    if (price <= 0) {
      toast.error("❌ El costo debe ser mayor a 0")
      return
    }

    setLoading(true)
    try {
      const unitCost = priceType === "unit" ? price : (quantity > 0 ? price / quantity : 0)

      const res = await fetch("/api/movements/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          warehouseId,
          productId,
          quantity,
          price: unitCost,
          priceType: "unit",
          paymentType: "cash",
          notes: "Compra rápida desde venta"
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al registrar compra")
      }

      toast.success("✅ Inventario agregado exitosamente", {
        description: `${quantity} unidad(es) agregada(s) a ${warehouseName}`,
        duration: 3000
      })

      onSuccess()
    } catch (error: any) {
      toast.error("❌ Error al agregar inventario", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onCancel])

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <Card 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Añadir Más Inventario de este producto
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Producto</Label>
            <Input value={productName} disabled className="bg-muted" />
          </div>

          <div>
            <Label>Bodega</Label>
            <Input value={warehouseName} disabled className="bg-muted" />
          </div>

          <div>
            <Label>Cantidad *</Label>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0
                setQuantity(val > 0 ? val : 1)
              }}
              placeholder="0"
            />
          </div>

          <div>
            <Label className="mb-2 block">Tipo de Costo</Label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Button
                type="button"
                variant={priceType === "unit" ? "default" : "outline"}
                className={`h-12 text-base font-medium ${
                  priceType === "unit" ? "bg-primary text-white" : ""
                }`}
                onClick={() => setPriceType("unit")}
              >
                Costo Unitario
              </Button>
              <Button
                type="button"
                variant={priceType === "total" ? "default" : "outline"}
                className={`h-12 text-base font-medium ${
                  priceType === "total" ? "bg-primary text-white" : ""
                }`}
                onClick={() => setPriceType("total")}
              >
                Costo Total
              </Button>
            </div>

            {lastCost && (
              <p className="text-sm text-muted-foreground mb-2">
                💡 Último costo: <span className="font-semibold">${lastCost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP</span>
              </p>
            )}

            <CurrencyInput
              value={price || 0}
              onChange={(val) => setPrice(val)}
              placeholder={lastCost ? lastCost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : (priceType === "unit" ? "10,000" : "100,000")}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {priceType === "unit" ? (
                <>Total: <span className="font-semibold">${totalPrice.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP</span></>
              ) : (
                <>Costo unitario: <span className="font-semibold">${(unitPrice || 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP</span></>
              )}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Registrando..." : "✅ Registrar Compra"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


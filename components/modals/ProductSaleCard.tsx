"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/shared/CurrencyInput"
import { X, Package, Warehouse, Plus } from "lucide-react"
import { toast } from "sonner"
import { QuickAddStockModal } from "./QuickAddStockModal"
import { ConfirmDialog } from "./ConfirmDialog"

interface ProductSaleItem {
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  quantity: number
  unitPrice: number
  priceType: "unit" | "total"
  lastSalePrice?: number | null
  stockQuantity: number
}

interface ProductSaleCardProps {
  product: {
    id: string
    name: string
    stock: Array<{
      warehouse: {
        id: string
        name: string
      }
      quantity: number
    }>
  }
  warehouseId: string
  warehouseName: string
  stockQuantity: number
  companyId: string
  onSave: (item: ProductSaleItem) => void
  onCancel: () => void
  onRemove: () => void
  onStockAdded?: () => void
}

export function ProductSaleCard({
  product,
  warehouseId,
  warehouseName,
  stockQuantity,
  companyId,
  onSave,
  onCancel,
  onRemove,
  onStockAdded
}: ProductSaleCardProps) {
  const [showAddStock, setShowAddStock] = useState(false)
  const [showStockWarning, setShowStockWarning] = useState(false)
  const [quantity, setQuantity] = useState<number>(1)
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [totalPriceInput, setTotalPriceInput] = useState<string>("")
  const [priceType, setPriceType] = useState<"unit" | "total">("unit")
  const [lastSalePrice, setLastSalePrice] = useState<number | null>(null)

  // Obtener último precio de venta
  useEffect(() => {
    fetch(`/api/products/${product.id}/last-sale-price`)
      .then(res => res.json())
      .then(data => {
        if (data.lastPrice) {
          setLastSalePrice(data.lastPrice)
          if (!unitPrice || unitPrice === 0) {
            setUnitPrice(data.lastPrice)
          }
        }
      })
      .catch(() => {})
  }, [product.id, unitPrice])

  // Calcular precio unitario cuando cambia el total
  useEffect(() => {
    if (priceType === "total" && totalPriceInput && quantity && quantity > 0) {
      const totalValue = parseFloat(totalPriceInput) || 0
      const calculatedUnitPrice = totalValue / quantity
      setUnitPrice(calculatedUnitPrice)
    }
  }, [totalPriceInput, quantity, priceType])

  // Calcular total cuando cambia precio unitario
  useEffect(() => {
    if (priceType === "unit" && unitPrice) {
      const calculatedTotal = (unitPrice || 0) * (quantity || 0)
      setTotalPriceInput(calculatedTotal.toString())
    }
  }, [unitPrice, quantity, priceType])

  const total = (unitPrice || 0) * (quantity || 0)

  const handleSave = () => {
    if (quantity <= 0) {
      toast.error("❌ La cantidad debe ser mayor a 0")
      return
    }
    if (unitPrice <= 0) {
      toast.error("❌ El precio debe ser mayor a 0")
      return
    }
    
    // Si la cantidad excede el stock, mostrar advertencia
    if (quantity > stockQuantity) {
      setShowStockWarning(true)
      return
    }

    onSave({
      productId: product.id,
      productName: product.name,
      warehouseId,
      warehouseName,
      quantity,
      unitPrice,
      priceType,
      lastSalePrice,
      stockQuantity
    })
  }

  const handleConfirmAddStock = () => {
    setShowStockWarning(false)
    // Calcular la cantidad necesaria
    const neededQuantity = quantity - stockQuantity
    setShowAddStock(true)
    // La cantidad se pasará al modal a través de props
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {product.name}
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Warehouse className="h-3 w-3" />
                {warehouseName} • Stock: {stockQuantity}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddStock(true)}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Aumentar stock
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cantidad */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Cantidad *</Label>
            {quantity > stockQuantity && (
              <span className="text-xs text-red-600 font-medium">
                ⚠️ Stock disponible: {stockQuantity}
              </span>
            )}
          </div>
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

        {/* Precio de Venta */}
        <div>
          <Label className="mb-2 block">Precio de Venta (COP)</Label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Button
              type="button"
              variant={priceType === "unit" ? "default" : "outline"}
              className={`h-12 text-base font-medium ${
                priceType === "unit" ? "bg-primary text-white" : ""
              }`}
              onClick={() => setPriceType("unit")}
            >
              Precio Unitario
            </Button>
            <Button
              type="button"
              variant={priceType === "total" ? "default" : "outline"}
              className={`h-12 text-base font-medium ${
                priceType === "total" ? "bg-primary text-white" : ""
              }`}
              onClick={() => setPriceType("total")}
            >
              Precio Total
            </Button>
          </div>
          
          {lastSalePrice && (
            <p className="text-sm text-muted-foreground mb-2">
              💡 Último precio: <span className="font-semibold">${lastSalePrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP</span>
            </p>
          )}

          {priceType === "unit" ? (
            <CurrencyInput
              value={unitPrice || 0}
              onChange={(val) => setUnitPrice(val)}
              placeholder={lastSalePrice ? lastSalePrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "1,000,000"}
            />
          ) : (
            <CurrencyInput
              value={parseFloat(totalPriceInput) || 0}
              onChange={(val) => {
                setTotalPriceInput(val.toString())
              }}
              placeholder="1,000,000"
            />
          )}
          
          <p className="text-sm text-muted-foreground mt-1">
            {priceType === "unit" ? (
              <>Total: <span className="font-semibold">${total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP</span></>
            ) : (
              <>Precio unitario: <span className="font-semibold">${(unitPrice || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP</span></>
            )}
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1"
          >
            Agregar
          </Button>
        </div>
      </CardContent>

      {/* Modal de Advertencia de Stock Insuficiente */}
      {showStockWarning && (
        <ConfirmDialog
          open={showStockWarning}
          onClose={() => setShowStockWarning(false)}
          onConfirm={handleConfirmAddStock}
          title="Stock Insuficiente"
          description={`Vas a agregar más, vas a vender más productos de los que tienes en stock. Deseas aumentar tu stock para así poder vender más productos?`}
          type="warning"
          confirmText="Sí, deseo agregar más stock"
        />
      )}

      {/* Modal de Añadir Inventario */}
      {showAddStock && (
        <QuickAddStockModal
          companyId={companyId}
          productId={product.id}
          productName={product.name}
          warehouseId={warehouseId}
          warehouseName={warehouseName}
          initialQuantity={quantity > stockQuantity ? quantity - stockQuantity : undefined}
          onSuccess={async () => {
            setShowAddStock(false)
            // Recargar el producto para actualizar el stock
            try {
              const res = await fetch(`/api/products/${product.id}`)
              if (res.ok) {
                const updatedProduct = await res.json()
                // Actualizar el stock en el producto
                product.stock = updatedProduct.stock || []
                // Notificar al padre para que actualice
                onStockAdded?.()
              }
            } catch (error) {
              console.error("Error recargando producto:", error)
            }
          }}
          onCancel={() => {
            setShowAddStock(false)
            // Si se canceló, simplemente cerrar el modal y volver a la tarjeta
          }}
        />
      )}
    </Card>
  )
}


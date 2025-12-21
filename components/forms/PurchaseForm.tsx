"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { purchaseSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CurrencyInput } from "@/components/shared/CurrencyInput"
import { ProductSearch } from "./ProductSearch"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"

type PurchaseFormData = {
  warehouseId: string
  productId: string
  quantity: number
  price: number
  priceType: "unit" | "total"
  paymentType: "cash" | "credit" | "mixed"
  cashAmount?: number
  creditAmount?: number
  notes?: string
}

interface PurchaseFormProps {
  companyId: string
  warehouses: Array<{ id: string; name: string }>
  onSuccess?: () => void
  onCancel?: () => void
}

export function PurchaseForm({ companyId, warehouses, onSuccess, onCancel }: PurchaseFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      priceType: "unit",
      paymentType: "cash"
    }
  })

  const priceType = watch("priceType")
  const paymentType = watch("paymentType")
  const quantity = watch("quantity")
  const price = watch("price")

  const unitPrice = priceType === "unit" 
    ? price 
    : price && quantity ? price / quantity : 0

  const total = price || 0

  const onSubmit = async (data: PurchaseFormData) => {
    setLoading(true)
    try {
      const res = await fetch("/api/movements/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          companyId
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al registrar compra")
      }

      toast.success("✅ Compra registrada exitosamente", {
        description: "La compra se ha guardado correctamente",
        duration: 3000
      })
      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        onSuccess?.()
      }, 500)
    } catch (error: any) {
      toast.error("❌ Error al registrar compra", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label>Bodega</Label>
        <Select {...register("warehouseId")}>
          <option value="">Seleccionar...</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </Select>
        {errors.warehouseId && (
          <p className="text-sm text-red-500">{errors.warehouseId.message}</p>
        )}
      </div>

      <div>
        <Label>Producto</Label>
        <ProductSearch
          companyId={companyId}
          onSelect={(product) => {
            setSelectedProduct(product)
            setValue("productId", product.id)
          }}
        />
        {selectedProduct && (
          <div className="mt-2 p-2 bg-muted rounded-md text-sm">
            ✓ {selectedProduct.name}
          </div>
        )}
        {errors.productId && (
          <p className="text-sm text-red-500">{errors.productId.message}</p>
        )}
      </div>

      <div>
        <Label>Cantidad</Label>
        <Input
          type="number"
          {...register("quantity", { valueAsNumber: true })}
          placeholder="0"
        />
        {errors.quantity && (
          <p className="text-sm text-red-500">{errors.quantity.message}</p>
        )}
      </div>

      <div>
        <Label>Tipo de Precio</Label>
        <RadioGroup
          value={priceType}
          onValueChange={(val) => setValue("priceType", val as any)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unit" id="unit" />
            <Label htmlFor="unit">Precio Unitario</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="total" id="total" />
            <Label htmlFor="total">Precio Total</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label>
          {priceType === "unit" ? "Precio Unitario (COP)" : "Precio Total (COP)"}
        </Label>
        <CurrencyInput
          value={price || 0}
          onChange={(val) => setValue("price", val)}
        />
        {priceType === "total" && quantity && (
          <p className="text-sm text-muted-foreground mt-1">
            Precio unitario: ${unitPrice.toLocaleString("es-CO")} COP
          </p>
        )}
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price.message}</p>
        )}
      </div>

      <div>
        <Label>Tipo de Pago</Label>
        <RadioGroup
          value={paymentType}
          onValueChange={(val) => setValue("paymentType", val as any)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash">Efectivo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="credit" id="credit" />
            <Label htmlFor="credit">Crédito</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mixed" id="mixed" />
            <Label htmlFor="mixed">Mixto</Label>
          </div>
        </RadioGroup>

        {paymentType === "mixed" && (
          <div className="mt-4 space-y-3 pl-6">
            <div>
              <Label>Efectivo (COP)</Label>
              <CurrencyInput
                value={watch("cashAmount") || 0}
                onChange={(val) => setValue("cashAmount", val)}
              />
            </div>
            <div>
              <Label>Crédito (COP)</Label>
              <CurrencyInput
                value={watch("creditAmount") || 0}
                onChange={(val) => setValue("creditAmount", val)}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <Label>Notas (Opcional)</Label>
        <textarea
          {...register("notes")}
          className="w-full border rounded-md p-2"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Guardando..." : "💾 Registrar Compra"}
        </Button>
      </div>
    </form>
  )
}


"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select } from "@/components/ui/select"
import { ProductSearch } from "./ProductSearch"
import { toast } from "sonner"

const saleSchema = z.object({
  warehouseId: z.string().min(1, "Selecciona una bodega"),
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.number().min(1, "Cantidad mínima: 1"),
  unitPrice: z.number().min(0, "Precio debe ser positivo"),
  paymentType: z.enum(["cash", "credit", "mixed"]),
  cashAmount: z.number().optional(),
  creditAmount: z.number().optional(),
  customerId: z.string().optional(),
  hasShipping: z.boolean().default(false),
  shippingCost: z.number().optional(),
  shippingPaidBy: z.enum(["seller", "customer"]).optional(),
  notes: z.string().optional()
}).refine((data) => {
  if (data.paymentType === "mixed") {
    return data.cashAmount && data.creditAmount &&
           data.cashAmount + data.creditAmount === data.unitPrice * data.quantity
  }
  return true
}, {
  message: "En pago mixto, la suma debe igualar el total",
  path: ["cashAmount"]
})

type SaleFormData = z.infer<typeof saleSchema>

interface SaleFormProps {
  companyId: string
  warehouses: Array<{ id: string; name: string }>
  customers?: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

export function SaleForm({ companyId, warehouses, customers = [], onSuccess }: SaleFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      paymentType: "cash",
      hasShipping: false
    }
  })

  const paymentType = watch("paymentType")
  const hasShipping = watch("hasShipping")
  const quantity = watch("quantity")
  const unitPrice = watch("unitPrice")

  const total = (quantity || 0) * (unitPrice || 0)

  const onSubmit = async (data: SaleFormData) => {
    setLoading(true)
    try {
      const res = await fetch("/api/movements/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          companyId
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al registrar venta")
      }

      toast.success("✅ Venta registrada exitosamente", {
        description: "La venta se ha guardado correctamente",
        duration: 3000
      })
      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        onSuccess?.()
      }, 500)
    } catch (error: any) {
      toast.error("❌ Error al registrar venta", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selección de Bodega */}
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

      {/* Búsqueda de Producto */}
      <div>
        <Label>Producto</Label>
        <ProductSearch
          companyId={companyId}
          onSelect={(product) => {
            setSelectedProduct(product)
            setValue("productId", product.id)
          }}
          onCreateNew={(name) => {
            toast.info("Funcionalidad de creación rápida próximamente")
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

      {/* Cantidad */}
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

      {/* Precio Unitario */}
      <div>
        <Label>Precio de Venta (COP)</Label>
        <Input
          type="number"
          step="0.01"
          {...register("unitPrice", { valueAsNumber: true })}
          placeholder="0"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Total: ${total.toLocaleString("es-CO")} COP
        </p>
        {errors.unitPrice && (
          <p className="text-sm text-red-500">{errors.unitPrice.message}</p>
        )}
      </div>

      {/* Cliente (Opcional) */}
      <div>
        <Label>Cliente (Opcional)</Label>
        <Select {...register("customerId")}>
          <option value="">Ninguno</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {/* Tipo de Pago */}
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
              <Input
                type="number"
                step="0.01"
                {...register("cashAmount", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label>Crédito (COP)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("creditAmount", { valueAsNumber: true })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Envío */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasShipping"
            checked={hasShipping}
            onCheckedChange={(checked) => setValue("hasShipping", !!checked)}
          />
          <Label htmlFor="hasShipping">Incluir costo de envío</Label>
        </div>

        {hasShipping && (
          <div className="pl-6 space-y-3">
            <div>
              <Label>Costo de Envío (COP)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("shippingCost", { valueAsNumber: true })}
              />
            </div>
            <RadioGroup
              defaultValue="customer"
              onValueChange={(val) => setValue("shippingPaidBy", val as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="customer" />
                <Label htmlFor="customer">Lo paga el cliente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="seller" id="seller" />
                <Label htmlFor="seller">Lo asumo yo</Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>

      {/* Notas */}
      <div>
        <Label>Notas (Opcional)</Label>
        <textarea
          {...register("notes")}
          className="w-full border rounded-md p-2"
          rows={3}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Guardando..." : "💾 Registrar Venta"}
        </Button>
      </div>
    </form>
  )
}


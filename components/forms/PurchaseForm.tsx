"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { purchaseSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/shared/CurrencyInput"
import { ProductSearch } from "./ProductSearch"
import { QuickProductCreationModal } from "@/components/modals/QuickProductCreationModal"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"

type PurchaseFormData = {
  warehouseId: string
  productId: string
  quantity: number
  price: number
  priceType: "unit" | "total"
  notes?: string
}

interface PurchaseFormProps {
  companyId: string
  warehouses: Array<{ id: string; name: string }>
  preselectedProductId?: string
  preselectedWarehouseId?: string
  onSuccess?: () => void
  onCancel?: () => void
  redirectOnQuickCreate?: boolean // Si es true, redirige al dashboard cuando se completa creación rápida
}

export function PurchaseForm({ companyId, warehouses, preselectedProductId, preselectedWarehouseId, onSuccess, onCancel, redirectOnQuickCreate = false }: PurchaseFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showQuickProductCreation, setShowQuickProductCreation] = useState(false)
  const [quickProductName, setQuickProductName] = useState("")

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
      warehouseId: preselectedWarehouseId || "",
      productId: preselectedProductId || ""
    }
  })

  // Pre-seleccionar bodega si viene de inventario
  useEffect(() => {
    if (preselectedWarehouseId) {
      setValue("warehouseId", preselectedWarehouseId)
    }
  }, [preselectedWarehouseId, setValue])

  const priceType = watch("priceType")
  const quantity = watch("quantity")
  const price = watch("price")
  const warehouseId = watch("warehouseId")

  const unitPrice = priceType === "unit" 
    ? price 
    : price && quantity ? price / quantity : 0

  const total = price || 0

  const onSubmit = async (data: PurchaseFormData) => {
    setLoading(true)
    try {
      // Calcular precio unitario
      const unitPrice = data.priceType === "unit" 
        ? data.price 
        : data.price && data.quantity ? data.price / data.quantity : 0

      const res = await fetch("/api/movements/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: data.warehouseId,
          productId: data.productId,
          quantity: data.quantity,
          price: unitPrice,
          priceType: "unit", // Siempre enviar como unitario al backend
          paymentType: "cash", // Las compras siempre son de contado
          companyId,
          notes: data.notes
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
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label>Bodega *</Label>
        <Select 
          value={warehouseId || ""}
          onChange={(e) => setValue("warehouseId", e.target.value, { shouldValidate: true })}
          required
        >
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
        <Label>Producto *</Label>
        <ProductSearch
          companyId={companyId}
          preselectedProductId={preselectedProductId}
          onSelect={(product) => {
            setSelectedProduct(product)
            setValue("productId", product.id, { shouldValidate: true })
          }}
          onCreateNew={(name) => {
            setQuickProductName(name)
            setShowQuickProductCreation(true)
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
        <Label>Cantidad *</Label>
        <Input
          type="number"
          inputMode="numeric"
          min="1"
          {...register("quantity", { valueAsNumber: true })}
          placeholder="0"
          required
        />
        {errors.quantity && (
          <p className="text-sm text-red-500">{errors.quantity.message}</p>
        )}
      </div>

      <div>
        <Label className="mb-2 block">Tipo de Precio</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={priceType === "unit" ? "default" : "outline"}
            className={`h-12 text-base font-medium ${
              priceType === "unit" ? "bg-primary text-white" : ""
            }`}
            onClick={() => setValue("priceType", "unit", { shouldValidate: true })}
          >
            Precio Unitario
          </Button>
          <Button
            type="button"
            variant={priceType === "total" ? "default" : "outline"}
            className={`h-12 text-base font-medium ${
              priceType === "total" ? "bg-primary text-white" : ""
            }`}
            onClick={() => setValue("priceType", "total", { shouldValidate: true })}
          >
            Precio Total
          </Button>
        </div>
      </div>

      <div>
        <Label>
          {priceType === "unit" ? "Precio Unitario (COP) *" : "Precio Total (COP) *"}
        </Label>
        <CurrencyInput
          value={price || 0}
          onChange={(val) => setValue("price", val, { shouldValidate: true })}
          placeholder={priceType === "unit" ? "10,000" : "100,000"}
        />
        {priceType === "total" && quantity && (
          <p className="text-sm text-muted-foreground mt-1">
            Costo unitario: ${unitPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP
          </p>
        )}
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price.message}</p>
        )}
      </div>

      <div>
        <Label>Notas (Opcional)</Label>
        <textarea
          {...register("notes")}
          className="w-full border rounded-md p-2 text-base"
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
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Registrando...
            </>
          ) : (
            "✅ Registrar Compra"
          )}
        </Button>
      </div>

    </form>

      {/* Modal para creación rápida de producto - Fuera del form para evitar conflictos */}
      {showQuickProductCreation && (
        <QuickProductCreationModal
          companyId={companyId}
          warehouses={warehouses}
          initialProductName={quickProductName}
          onSuccess={async (productId) => {
            setShowQuickProductCreation(false)
            setQuickProductName("")
            
            // Si redirectOnQuickCreate es true, redirigir al dashboard porque ya se registró la compra
            if (redirectOnQuickCreate) {
              toast.success("✅ Producto creado y compra registrada", {
                description: "Redirigiendo al dashboard...",
                duration: 2000
              })
              setTimeout(() => {
                window.location.href = "/dashboard"
              }, 1000)
              return
            }
            
            // Si no, recargar el producto para seleccionarlo
            try {
              const res = await fetch(`/api/companies/${companyId}/products`)
              if (res.ok) {
                const products = await res.json()
                const newProduct = products.find((p: any) => p.id === productId)
                if (newProduct) {
                  setSelectedProduct(newProduct)
                  setValue("productId", newProduct.id)
                  toast.success("✅ Producto listo para comprar", {
                    description: `"${newProduct.name}" está disponible en inventario`,
                    duration: 3000
                  })
                }
              }
            } catch (error) {
              console.error("Error cargando producto:", error)
            }
          }}
          onCancel={() => {
            setShowQuickProductCreation(false)
            setQuickProductName("")
          }}
        />
      )}
    </>
  )
}


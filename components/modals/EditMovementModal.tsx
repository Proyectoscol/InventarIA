"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ProductSearch } from "@/components/forms/ProductSearch"
import { CurrencyInput } from "@/components/shared/CurrencyInput"
import { toast } from "sonner"
import { X } from "lucide-react"
import { Movement } from "@/types"

const editMovementSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.number().min(1, "Cantidad mínima: 1"),
  unitPrice: z.number().min(0, "Precio debe ser positivo"),
  paymentType: z.enum(["cash", "credit", "mixed"]),
  cashAmount: z.number().optional(),
  creditAmount: z.number().optional(),
  creditDays: z.number().int().min(1).optional(),
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
}).refine((data) => {
  if (data.paymentType === "credit" || data.paymentType === "mixed") {
    return data.creditDays !== undefined && data.creditDays > 0
  }
  return true
}, {
  message: "Debes especificar los días de crédito",
  path: ["creditDays"]
})

type EditMovementFormData = z.infer<typeof editMovementSchema>

interface EditMovementModalProps {
  movement: Movement
  companyId: string
  warehouses: Array<{ id: string; name: string }>
  onSuccess: () => void
  onClose: () => void
}

export function EditMovementModal({ movement, companyId, warehouses, onSuccess, onClose }: EditMovementModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [priceInputType, setPriceInputType] = useState<"unit" | "total">("unit")
  const [totalPriceInput, setTotalPriceInput] = useState<string>("")
  const [creditDaysType, setCreditDaysType] = useState<"preset" | "custom">("preset")
  const [customCreditDays, setCustomCreditDays] = useState<string>("")
  const [forceUpdate, setForceUpdate] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EditMovementFormData>({
    resolver: zodResolver(editMovementSchema),
    defaultValues: {
      productId: movement.productId,
      quantity: Number(movement.quantity),
      unitPrice: Number(movement.unitPrice),
      paymentType: movement.paymentType as "cash" | "credit" | "mixed",
      cashAmount: movement.cashAmount ? Number(movement.cashAmount) : undefined,
      creditAmount: movement.creditAmount ? Number(movement.creditAmount) : undefined,
      creditDays: movement.creditDays || undefined,
      hasShipping: movement.hasShipping || false,
      shippingCost: movement.shippingCost ? Number(movement.shippingCost) : undefined,
      shippingPaidBy: movement.shippingPaidBy as "seller" | "customer" | undefined,
      notes: movement.notes || ""
    }
  })

  const paymentType = watch("paymentType")
  const hasShipping = watch("hasShipping")
  const quantity = watch("quantity")
  const unitPrice = watch("unitPrice")
  const total = (unitPrice || 0) * (quantity || 0)

  // Cargar producto seleccionado
  useEffect(() => {
    if (movement.product) {
      setSelectedProduct(movement.product)
    }
  }, [movement])

  // Inicializar valores de crédito
  useEffect(() => {
    if (paymentType === "credit" || paymentType === "mixed") {
      const currentDays = watch("creditDays")
      if (!currentDays || currentDays <= 0) {
        setValue("creditDays", movement.creditDays || 15, { shouldValidate: true })
        setCreditDaysType("preset")
      }
    }
    setForceUpdate(prev => prev + 1)
  }, [paymentType, setValue, watch, movement.creditDays])

  const onSubmit = async (data: EditMovementFormData) => {
    setLoading(true)
    try {
      const calculatedTotal = data.unitPrice * data.quantity
      
      let finalCashAmount: number | undefined = undefined
      let finalCreditAmount: number | undefined = undefined
      
      if (data.paymentType === "cash") {
        finalCashAmount = calculatedTotal
        finalCreditAmount = undefined
      } else if (data.paymentType === "credit") {
        finalCashAmount = undefined
        finalCreditAmount = calculatedTotal
      } else if (data.paymentType === "mixed") {
        finalCashAmount = data.cashAmount || 0
        finalCreditAmount = data.creditAmount || 0
      }

      const payload = {
        ...data,
        companyId,
        warehouseId: movement.warehouseId,
        customerId: movement.customerId,
        cashAmount: finalCashAmount,
        creditAmount: finalCreditAmount,
        creditDays: data.paymentType === "credit" || data.paymentType === "mixed" ? data.creditDays : undefined
      }

      const res = await fetch(`/api/movements/${movement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al actualizar movimiento")
      }

      toast.success("✅ Movimiento actualizado exitosamente", {
        description: "Los cambios se han guardado correctamente",
        duration: 3000
      })
      
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error("❌ Error al actualizar movimiento", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Editar Movimiento</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <p><strong>No. Movimiento:</strong> {movement.movementNumber}</p>
            <p><strong>Fecha:</strong> {new Date(movement.movementDate).toLocaleString("es-CO")}</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Producto */}
            <div>
              <Label>Producto *</Label>
              <ProductSearch
                companyId={companyId}
                preselectedProductId={movement.productId}
                onSelect={(product) => {
                  setSelectedProduct(product)
                  setValue("productId", product.id, { shouldValidate: true })
                }}
              />
              {errors.productId && (
                <p className="text-sm text-red-500">{errors.productId.message}</p>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <Label>Cantidad *</Label>
              <Input
                type="number"
                {...register("quantity", { valueAsNumber: true })}
                placeholder="0"
                min="1"
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity.message}</p>
              )}
            </div>

            {/* Precio */}
            <div>
              <Label className="mb-2 block">Precio de Venta (COP)</Label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Button
                  type="button"
                  variant={priceInputType === "unit" ? "default" : "outline"}
                  className={`h-12 text-base font-medium ${
                    priceInputType === "unit" ? "bg-primary text-white" : ""
                  }`}
                  onClick={() => setPriceInputType("unit")}
                >
                  Precio Unitario
                </Button>
                <Button
                  type="button"
                  variant={priceInputType === "total" ? "default" : "outline"}
                  className={`h-12 text-base font-medium ${
                    priceInputType === "total" ? "bg-primary text-white" : ""
                  }`}
                  onClick={() => setPriceInputType("total")}
                >
                  Precio Total
                </Button>
              </div>
              
              {priceInputType === "unit" ? (
                <CurrencyInput
                  value={unitPrice || 0}
                  onChange={(val) => setValue("unitPrice", val, { shouldValidate: true })}
                  placeholder="10,000"
                />
              ) : (
                <CurrencyInput
                  value={parseFloat(totalPriceInput) || 0}
                  onChange={(val) => {
                    setTotalPriceInput(val.toString())
                    if (quantity && quantity > 0) {
                      setValue("unitPrice", val / quantity, { shouldValidate: true })
                    }
                  }}
                  placeholder="100,000"
                />
              )}
              
              <p className="text-sm text-muted-foreground mt-1">
                {priceInputType === "unit" ? (
                  <>Total: <span className="font-semibold">${total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP</span></>
                ) : (
                  <>Precio unitario: <span className="font-semibold">${(unitPrice || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP</span></>
                )}
              </p>
              {errors.unitPrice && (
                <p className="text-sm text-red-500">{errors.unitPrice.message}</p>
              )}
            </div>

            {/* Tipo de Pago */}
            <div>
              <Label className="mb-2 block">Tipo de Pago</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={paymentType === "cash" ? "default" : "outline"}
                  className={`h-12 text-base font-medium ${
                    paymentType === "cash" ? "bg-primary text-white" : ""
                  }`}
                  onClick={() => {
                    setValue("paymentType", "cash", { shouldValidate: true, shouldDirty: true })
                    setForceUpdate(prev => prev + 1)
                    setTimeout(() => {
                      setValue("cashAmount", undefined)
                      setValue("creditAmount", undefined)
                      setValue("creditDays", undefined)
                    }, 0)
                  }}
                >
                  Contado
                </Button>
                <Button
                  type="button"
                  variant={paymentType === "credit" ? "default" : "outline"}
                  className={`h-12 text-base font-medium ${
                    paymentType === "credit" ? "bg-primary text-white" : ""
                  }`}
                  onClick={() => {
                    setValue("paymentType", "credit", { shouldValidate: true, shouldDirty: true })
                    setForceUpdate(prev => prev + 1)
                    setTimeout(() => {
                      setValue("cashAmount", undefined)
                      if (total > 0) {
                        setValue("creditAmount", total, { shouldValidate: true })
                      } else {
                        setValue("creditAmount", 0, { shouldValidate: true })
                      }
                      const currentDays = watch("creditDays")
                      if (!currentDays || currentDays <= 0) {
                        setValue("creditDays", 15, { shouldValidate: true })
                        setCreditDaysType("preset")
                      }
                    }, 0)
                  }}
                >
                  Crédito
                </Button>
                <Button
                  type="button"
                  variant={paymentType === "mixed" ? "default" : "outline"}
                  className={`h-12 text-base font-medium ${
                    paymentType === "mixed" ? "bg-primary text-white" : ""
                  }`}
                  onClick={() => {
                    setValue("paymentType", "mixed", { shouldValidate: true, shouldDirty: true })
                    setForceUpdate(prev => prev + 1)
                    setTimeout(() => {
                      const currentCash = watch("cashAmount")
                      const currentCredit = watch("creditAmount")
                      if ((!currentCash || currentCash === 0) && (!currentCredit || currentCredit === 0)) {
                        if (total > 0) {
                          const half = total / 2
                          setValue("cashAmount", half, { shouldValidate: true })
                          setValue("creditAmount", half, { shouldValidate: true })
                        } else {
                          setValue("cashAmount", 0, { shouldValidate: true })
                          setValue("creditAmount", 0, { shouldValidate: true })
                        }
                      }
                      const currentDays = watch("creditDays")
                      if (!currentDays || currentDays <= 0) {
                        setValue("creditDays", 15, { shouldValidate: true })
                        setCreditDaysType("preset")
                      }
                    }, 0)
                  }}
                >
                  Mixto
                </Button>
              </div>

              {/* Campos para crédito */}
              {(paymentType === "credit" || paymentType === "mixed") && (
                <div className="mt-4 space-y-3 pl-6 border-l-2 border-primary/20">
                  <div>
                    <Label>Plazo de Crédito (días)</Label>
                    <div className="flex gap-2 mb-2">
                      <Button
                        type="button"
                        variant={creditDaysType === "preset" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCreditDaysType("preset")}
                      >
                        Predefinido
                      </Button>
                      <Button
                        type="button"
                        variant={creditDaysType === "custom" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCreditDaysType("custom")}
                      >
                        Personalizado
                      </Button>
                    </div>
                    {creditDaysType === "preset" ? (
                      <div className="flex gap-2">
                        {[5, 15, 20, 30].map((days) => (
                          <Button
                            key={days}
                            type="button"
                            variant={watch("creditDays") === days ? "default" : "outline"}
                            size="sm"
                            onClick={() => setValue("creditDays", days, { shouldValidate: true })}
                          >
                            {days}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Input
                        type="number"
                        min="1"
                        value={customCreditDays}
                        onChange={(e) => {
                          setCustomCreditDays(e.target.value)
                          const days = parseInt(e.target.value)
                          if (days > 0) {
                            setValue("creditDays", days, { shouldValidate: true })
                          }
                        }}
                        placeholder="Ej: 45"
                      />
                    )}
                    {errors.creditDays && (
                      <p className="text-sm text-red-500">{errors.creditDays.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Campos para mixto */}
              {paymentType === "mixed" && (
                <div className="mt-4 space-y-3 pl-6 border-l-2 border-primary/20">
                  <div>
                    <Label>Contado (COP)</Label>
                    <CurrencyInput
                      value={watch("cashAmount") || 0}
                      onChange={(val) => {
                        setValue("cashAmount", val, { shouldValidate: true })
                        const credit = total - val
                        setValue("creditAmount", credit > 0 ? credit : 0, { shouldValidate: true })
                      }}
                      placeholder="500,000"
                    />
                  </div>
                  <div>
                    <Label>Crédito (COP)</Label>
                    <CurrencyInput
                      value={watch("creditAmount") || 0}
                      onChange={(val) => {
                        setValue("creditAmount", val, { shouldValidate: true })
                        const cash = total - val
                        setValue("cashAmount", cash > 0 ? cash : 0, { shouldValidate: true })
                      }}
                      placeholder="500,000"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Envío */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasShipping"
                  checked={hasShipping}
                  onChange={(e) => setValue("hasShipping", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="hasShipping">Incluir costo de envío</Label>
              </div>

              {hasShipping && (
                <div className="pl-6 space-y-3">
                  <div>
                    <Label>Costo de Envío (COP)</Label>
                    <CurrencyInput
                      value={watch("shippingCost") || 0}
                      onChange={(val) => setValue("shippingCost", val, { shouldValidate: true })}
                      placeholder="50,000"
                    />
                  </div>
                  <div>
                    <Label>Lo paga</Label>
                    <Select
                      value={watch("shippingPaidBy") || "customer"}
                      onChange={(e) => setValue("shippingPaidBy", e.target.value as "seller" | "customer")}
                    >
                      <option value="customer">El cliente</option>
                      <option value="seller">Yo (vendedor)</option>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Notas */}
            <div>
              <Label>Notas (Opcional)</Label>
              <textarea
                {...register("notes")}
                className="w-full border rounded-md p-2 text-base"
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Guardando..." : "✅ Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


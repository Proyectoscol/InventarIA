"use client"

import { useState, useEffect } from "react"
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
import { CustomerForm } from "./CustomerForm"
import { QuickProductCreationModal } from "@/components/modals/QuickProductCreationModal"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const saleSchema = z.object({
  warehouseId: z.string().min(1, "Selecciona una bodega"),
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.number().min(1, "Cantidad mínima: 1"),
  unitPrice: z.number().min(0, "Precio debe ser positivo"),
  paymentType: z.enum(["cash", "credit", "mixed"]),
  cashAmount: z.number().optional(),
  creditAmount: z.number().optional(),
  creditDays: z.number().int().min(1).optional(), // Días de crédito (requerido si es crédito o mixto)
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
}).refine((data) => {
  if (data.paymentType === "credit" || data.paymentType === "mixed") {
    return data.creditDays !== undefined && data.creditDays > 0
  }
  return true
}, {
  message: "Debes especificar los días de crédito",
  path: ["creditDays"]
})

type SaleFormData = z.infer<typeof saleSchema>

interface SaleFormProps {
  companyId: string
  warehouses: Array<{ id: string; name: string }>
  customers?: Array<{ id: string; name: string }>
  onSuccess?: () => void
  onCustomerCreated?: (customer: any) => void
}

export function SaleForm({ companyId, warehouses, customers: initialCustomers = [], onSuccess, onCustomerCreated }: SaleFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showQuickProductCreation, setShowQuickProductCreation] = useState(false)
  const [quickProductName, setQuickProductName] = useState("")
  const [customers, setCustomers] = useState(initialCustomers)
  const [lastSalePrice, setLastSalePrice] = useState<number | null>(null)
  const [priceInputType, setPriceInputType] = useState<"unit" | "total">("unit")
  const [totalPriceInput, setTotalPriceInput] = useState<string>("")
  const [creditDaysType, setCreditDaysType] = useState<"preset" | "custom">("preset")
  const [customCreditDays, setCustomCreditDays] = useState<string>("")
  const [stockInfo, setStockInfo] = useState<{ quantity: number; isLowStock: boolean } | null>(null)
  
  // Actualizar lista de clientes cuando cambia el prop
  useEffect(() => {
    setCustomers(initialCustomers)
  }, [initialCustomers])

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
  const productId = watch("productId")
  const warehouseId = watch("warehouseId")
  const creditDays = watch("creditDays")

  const total = (quantity || 0) * (unitPrice || 0)

  // Obtener stock cuando se selecciona producto y bodega
  useEffect(() => {
    if (productId && warehouseId) {
      fetch(`/api/products/${productId}/stock?warehouseId=${warehouseId}`)
        .then(res => res.json())
        .then(data => {
          if (data.quantity !== undefined) {
            setStockInfo({
              quantity: data.quantity,
              isLowStock: data.isLowStock || false
            })
          } else {
            setStockInfo(null)
          }
        })
        .catch(err => {
          console.error("Error obteniendo stock:", err)
          setStockInfo(null)
        })
    } else {
      setStockInfo(null)
    }
  }, [productId, warehouseId])

  // Actualizar creditAmount cuando es crédito puro y asegurar que creditDays esté definido
  useEffect(() => {
    if (paymentType === "credit" && total > 0) {
      setValue("creditAmount", total, { shouldValidate: true })
      // Asegurar que creditDays esté definido
      const currentDays = watch("creditDays")
      if (!currentDays || currentDays <= 0) {
        setValue("creditDays", 15, { shouldValidate: true })
        setCreditDaysType("preset")
      }
    } else if (paymentType === "mixed" && total > 0) {
      // Asegurar que creditDays esté definido para mixto
      const currentDays = watch("creditDays")
      if (!currentDays || currentDays <= 0) {
        setValue("creditDays", 15, { shouldValidate: true })
        setCreditDaysType("preset")
      }
      // Asegurar que cashAmount y creditAmount estén definidos
      const currentCash = watch("cashAmount")
      const currentCredit = watch("creditAmount")
      if ((!currentCash || currentCash === 0) && (!currentCredit || currentCredit === 0)) {
        setValue("cashAmount", total / 2, { shouldValidate: true })
        setValue("creditAmount", total / 2, { shouldValidate: true })
      }
    }
  }, [paymentType, total, setValue, watch])

  // Obtener último precio de venta cuando se selecciona un producto
  useEffect(() => {
    if (productId) {
      fetch(`/api/products/${productId}/last-sale-price`)
        .then(res => res.json())
        .then(data => {
          if (data.lastPrice) {
            setLastSalePrice(data.lastPrice)
            // Solo sugerir el último precio si no hay precio ingresado
            if (!unitPrice || unitPrice === 0) {
              setValue("unitPrice", data.lastPrice)
            }
          } else {
            setLastSalePrice(null)
          }
        })
        .catch(err => {
          console.error("Error obteniendo último precio:", err)
          setLastSalePrice(null)
        })
    } else {
      setLastSalePrice(null)
    }
  }, [productId, setValue, unitPrice])

  // Actualizar precio unitario cuando cambia el precio total
  useEffect(() => {
    if (priceInputType === "total" && totalPriceInput && quantity && quantity > 0) {
      const totalValue = parseFloat(totalPriceInput) || 0
      const calculatedUnitPrice = totalValue / quantity
      setValue("unitPrice", calculatedUnitPrice, { shouldValidate: true })
    }
  }, [totalPriceInput, quantity, priceInputType, setValue])

  // Actualizar input total cuando cambia el precio unitario (modo unitario)
  useEffect(() => {
    if (priceInputType === "unit" && unitPrice) {
      const calculatedTotal = (unitPrice || 0) * (quantity || 0)
      setTotalPriceInput(calculatedTotal.toString())
    }
  }, [unitPrice, quantity, priceInputType])

  const onSubmit = async (data: SaleFormData) => {
    setLoading(true)
    try {
      // Calcular total
      const calculatedTotal = data.unitPrice * data.quantity
      
      // Preparar datos según el tipo de pago
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
      
      const res = await fetch("/api/movements/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          companyId,
          customerId: data.customerId && data.customerId.trim() !== "" ? data.customerId : null,
          cashAmount: finalCashAmount,
          creditAmount: finalCreditAmount,
          creditDays: data.paymentType === "credit" || data.paymentType === "mixed" ? data.creditDays : undefined
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
    <>
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
            setQuickProductName(name)
            setShowQuickProductCreation(true)
          }}
        />
        {selectedProduct && (
          <div className="mt-2 p-2 bg-muted rounded-md text-sm">
            ✓ {selectedProduct.name}
          </div>
        )}
        {stockInfo !== null && warehouseId && (
          <div className={`mt-2 p-3 rounded-md text-sm ${
            stockInfo.isLowStock 
              ? "bg-orange-50 border border-orange-200" 
              : stockInfo.quantity === 0
              ? "bg-red-50 border border-red-200"
              : "bg-blue-50 border border-blue-200"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {stockInfo.isLowStock ? "⚠️ Stock bajo" : stockInfo.quantity === 0 ? "❌ Sin stock" : "📦 Stock disponible"}
              </span>
              <span className={`font-bold ${
                stockInfo.isLowStock 
                  ? "text-orange-700" 
                  : stockInfo.quantity === 0
                  ? "text-red-700"
                  : "text-blue-700"
              }`}>
                {stockInfo.quantity} unidades
              </span>
            </div>
            {stockInfo.quantity > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Puedes vender hasta {stockInfo.quantity} unidades
              </p>
            )}
            {stockInfo.quantity === 0 && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                No hay stock disponible en esta bodega
              </p>
            )}
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

      {/* Precio de Venta */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Precio de Venta (COP)</Label>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="price-unit"
                name="price-input-type"
                checked={priceInputType === "unit"}
                onChange={() => setPriceInputType("unit")}
                className="h-4 w-4"
              />
              <Label htmlFor="price-unit" className="text-sm font-normal cursor-pointer">
                Unitario
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="price-total"
                name="price-input-type"
                checked={priceInputType === "total"}
                onChange={() => setPriceInputType("total")}
                className="h-4 w-4"
              />
              <Label htmlFor="price-total" className="text-sm font-normal cursor-pointer">
                Total
              </Label>
            </div>
          </div>
        </div>
        
        {lastSalePrice && (
          <p className="text-sm text-muted-foreground mb-2">
            💡 Último precio de venta: <span className="font-semibold">${lastSalePrice.toLocaleString("es-CO")} COP</span> (por unidad)
          </p>
        )}

        {priceInputType === "unit" ? (
          <Input
            type="number"
            step="0.01"
            {...register("unitPrice", { valueAsNumber: true })}
            placeholder={lastSalePrice ? lastSalePrice.toString() : "0"}
          />
        ) : (
          <Input
            type="number"
            step="0.01"
            placeholder="0"
            value={totalPriceInput}
            onChange={(e) => {
              setTotalPriceInput(e.target.value)
            }}
          />
        )}
        
        <p className="text-sm text-muted-foreground mt-1">
          {priceInputType === "unit" ? (
            <>Total: <span className="font-semibold">${total.toLocaleString("es-CO")} COP</span></>
          ) : (
            <>Precio unitario: <span className="font-semibold">${(unitPrice || 0).toLocaleString("es-CO")} COP</span></>
          )}
        </p>
        {errors.unitPrice && (
          <p className="text-sm text-red-500">{errors.unitPrice.message}</p>
        )}
      </div>

      {/* Cliente (Opcional) */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Cliente (Opcional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCreateCustomer(true)}
          >
            + Crear Cliente
          </Button>
        </div>
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
          value={paymentType || "cash"}
          onValueChange={(val) => {
            console.log("RadioGroup onValueChange:", val) // Debug
            setValue("paymentType", val as any, { shouldValidate: true })
            // Resetear valores cuando cambia el tipo de pago
            if (val === "cash") {
              setValue("cashAmount", undefined)
              setValue("creditAmount", undefined)
              setValue("creditDays", undefined)
            } else if (val === "credit") {
              setValue("cashAmount", undefined)
              setValue("creditAmount", total > 0 ? total : 0)
              // Inicializar días de crédito si no están definidos
              const currentDays = watch("creditDays")
              if (!currentDays) {
                setValue("creditDays", 15, { shouldValidate: true })
                setCreditDaysType("preset")
              }
            } else if (val === "mixed") {
              // Mantener valores si ya existen, sino dividir en partes iguales
              const currentCash = watch("cashAmount")
              const currentCredit = watch("creditAmount")
              if ((!currentCash || currentCash === 0) && (!currentCredit || currentCredit === 0)) {
                const half = total > 0 ? total / 2 : 0
                setValue("cashAmount", half, { shouldValidate: true })
                setValue("creditAmount", half, { shouldValidate: true })
              }
              // Inicializar días de crédito si no están definidos
              const currentDays = watch("creditDays")
              if (!currentDays) {
                setValue("creditDays", 15, { shouldValidate: true })
                setCreditDaysType("preset")
              }
            }
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cash" id="payment-cash" name="payment-type" />
            <Label htmlFor="payment-cash" className="cursor-pointer">Contado</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="credit" id="payment-credit" name="payment-type" />
            <Label htmlFor="payment-credit" className="cursor-pointer">Crédito</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mixed" id="payment-mixed" name="payment-type" />
            <Label htmlFor="payment-mixed" className="cursor-pointer">Mixto</Label>
          </div>
        </RadioGroup>

        {/* Debug temporal - remover después */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 text-xs text-gray-500">
            Debug: paymentType = {paymentType || "undefined"}
          </div>
        )}

        {/* Campos para crédito */}
        {(paymentType === "credit" || paymentType === "mixed") && (
          <div className="mt-4 space-y-3 pl-6 border-l-2 border-primary/20">
            {/* Días de crédito */}
            <div>
              <Label>Plazo de Crédito (días)</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={creditDaysType === "preset" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCreditDaysType("preset")
                    const currentDays = watch("creditDays") || 15
                    if ([5, 15, 20, 30].includes(currentDays)) {
                      setValue("creditDays", currentDays)
                    } else {
                      setValue("creditDays", 15)
                    }
                  }}
                >
                  Predefinido
                </Button>
                <Button
                  type="button"
                  variant={creditDaysType === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCreditDaysType("custom")
                    setCustomCreditDays(watch("creditDays")?.toString() || "")
                  }}
                >
                  Personalizado
                </Button>
              </div>
              
              {creditDaysType === "preset" ? (
                <div className="grid grid-cols-4 gap-2">
                  {[5, 15, 20, 30].map((days) => (
                    <Button
                      key={days}
                      type="button"
                      variant={watch("creditDays") === days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setValue("creditDays", days)}
                    >
                      {days} días
                    </Button>
                  ))}
                </div>
              ) : (
                <Input
                  type="number"
                  min="1"
                  placeholder="Ej: 45"
                  value={customCreditDays}
                  onChange={(e) => {
                    setCustomCreditDays(e.target.value)
                    const days = parseInt(e.target.value)
                    if (days > 0) {
                      setValue("creditDays", days)
                    }
                  }}
                />
              )}
              {errors.creditDays && (
                <p className="text-sm text-red-500 mt-1">{errors.creditDays.message}</p>
              )}
            </div>

            {/* Campos para mixto */}
            {paymentType === "mixed" && (
              <>
                <div>
                  <Label>Contado (COP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("cashAmount", { 
                      valueAsNumber: true,
                      onChange: (e) => {
                        const cash = parseFloat(e.target.value) || 0
                        const credit = total - cash
                        setValue("creditAmount", credit > 0 ? credit : 0)
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: ${total.toLocaleString("es-CO")} - Crédito: ${(watch("creditAmount") || 0).toLocaleString("es-CO")}
                  </p>
                </div>
                <div>
                  <Label>Crédito (COP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("creditAmount", { 
                      valueAsNumber: true,
                      onChange: (e) => {
                        const credit = parseFloat(e.target.value) || 0
                        const cash = total - credit
                        setValue("cashAmount", cash > 0 ? cash : 0)
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: ${total.toLocaleString("es-CO")} - Contado: ${(watch("cashAmount") || 0).toLocaleString("es-CO")}
                  </p>
                </div>
              </>
            )}

            {/* Para crédito puro, mostrar el total automáticamente */}
            {paymentType === "credit" && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Monto a crédito:</span> ${total.toLocaleString("es-CO")} COP
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este monto se registrará como crédito pendiente
                </p>
              </div>
            )}
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
              value={watch("shippingPaidBy") || "customer"}
              onValueChange={(val) => setValue("shippingPaidBy", val as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="customer" name="shipping-paid-by" />
                <Label htmlFor="customer">Lo paga el cliente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="seller" id="seller" name="shipping-paid-by" />
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
          className="w-full border rounded-md p-2 text-base"
          rows={3}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Registrando...
            </>
          ) : (
            "✅ Registrar Venta"
          )}
        </Button>
      </div>
    </form>

    {/* Modales renderizados fuera del formulario para evitar conflictos */}
    {showCreateCustomer && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Crear Nuevo Cliente</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateCustomer(false)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CustomerForm
              companyId={companyId}
              onSuccess={(newCustomer) => {
                if (newCustomer) {
                  const updatedCustomers = [...customers, newCustomer]
                  setCustomers(updatedCustomers)
                  setValue("customerId", newCustomer.id)
                  onCustomerCreated?.(newCustomer)
                  setShowCreateCustomer(false)
                }
              }}
              onCancel={() => setShowCreateCustomer(false)}
            />
          </CardContent>
        </Card>
      </div>
    )}

    {/* Modal para creación rápida de producto */}
    {showQuickProductCreation && (
      <QuickProductCreationModal
        companyId={companyId}
        warehouses={warehouses}
        initialProductName={quickProductName}
        onSuccess={async (productId) => {
          setShowQuickProductCreation(false)
          // Recargar el producto para obtener todos sus datos
          try {
            const res = await fetch(`/api/companies/${companyId}/products`)
            if (res.ok) {
              const products = await res.json()
              const newProduct = products.find((p: any) => p.id === productId)
              if (newProduct) {
                setSelectedProduct(newProduct)
                setValue("productId", newProduct.id)
                toast.success("✅ Producto listo para vender", {
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


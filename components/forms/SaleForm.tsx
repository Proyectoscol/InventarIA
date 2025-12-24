"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ProductSearchWithWarehouse } from "./ProductSearchWithWarehouse"
import { CustomerSearch } from "./CustomerSearch"
import { ProductSaleCard } from "@/components/modals/ProductSaleCard"
import { CustomerForm } from "./CustomerForm"
import { QuickProductCreationModal } from "@/components/modals/QuickProductCreationModal"
import { CurrencyInput } from "@/components/shared/CurrencyInput"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, X, ShoppingCart, Edit } from "lucide-react"

const saleSchema = z.object({
  customerId: z.string().min(1, "Cliente es obligatorio"),
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
    return data.cashAmount !== undefined && data.creditAmount !== undefined &&
           (data.cashAmount || 0) + (data.creditAmount || 0) > 0
  }
  return true
}, {
  message: "En pago mixto, debe haber montos de contado y crédito",
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

interface SaleFormProps {
  companyId: string
  warehouses: Array<{ id: string; name: string }>
  customers?: Array<{ id: string; name: string }>
  onSuccess?: () => void
  onCustomerCreated?: (customer: any) => void
}

export function SaleForm({ companyId, warehouses, customers: initialCustomers = [], onSuccess, onCustomerCreated }: SaleFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")
  const [showProductCard, setShowProductCard] = useState(false)
  const [productItems, setProductItems] = useState<ProductSaleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showQuickProductCreation, setShowQuickProductCreation] = useState(false)
  const [quickProductName, setQuickProductName] = useState("")
  const [quickCustomerName, setQuickCustomerName] = useState("")
  const [customers, setCustomers] = useState(initialCustomers)
  const [creditDaysType, setCreditDaysType] = useState<"preset" | "custom">("preset")
  const [customCreditDays, setCustomCreditDays] = useState<string>("")
  const [forceUpdate, setForceUpdate] = useState(0)
  const [showProductSearch, setShowProductSearch] = useState(true)
  
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
  const customerId = watch("customerId")
  const creditDays = watch("creditDays")

  // Calcular subtotal de todos los productos
  const subtotal = productItems.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity)
  }, 0)

  // Escuchar cambios en paymentType
  useEffect(() => {
    if (paymentType === "credit") {
      if (subtotal > 0) {
        setValue("creditAmount", subtotal, { shouldValidate: true })
      }
      setValue("cashAmount", undefined)
      const currentDays = watch("creditDays")
      if (!currentDays || currentDays <= 0) {
        setValue("creditDays", 15, { shouldValidate: true })
        setCreditDaysType("preset")
      }
    } else if (paymentType === "mixed") {
      const currentDays = watch("creditDays")
      if (!currentDays || currentDays <= 0) {
        setValue("creditDays", 15, { shouldValidate: true })
        setCreditDaysType("preset")
      }
      const currentCash = watch("cashAmount")
      const currentCredit = watch("creditAmount")
      if ((!currentCash || currentCash === 0) && (!currentCredit || currentCredit === 0)) {
        if (subtotal > 0) {
          setValue("cashAmount", subtotal / 2, { shouldValidate: true })
          setValue("creditAmount", subtotal / 2, { shouldValidate: true })
        }
      }
    } else if (paymentType === "cash") {
      setValue("creditAmount", undefined)
      setValue("creditDays", undefined)
    }
    setForceUpdate(prev => prev + 1)
  }, [paymentType, subtotal, setValue, watch])

  const handleProductSelect = (product: any, warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId)
    const stockItem = product.stock.find((s: any) => s.warehouse.id === warehouseId)
    const stockQuantity = stockItem?.quantity || 0

    setSelectedProduct(product)
    setSelectedWarehouseId(warehouseId)
    setShowProductCard(true)
    setShowProductSearch(false)
  }

  const handleProductSave = (item: ProductSaleItem) => {
    // Verificar que no esté duplicado (mismo producto y bodega)
    const exists = productItems.some(
      p => p.productId === item.productId && p.warehouseId === item.warehouseId
    )
    
    if (exists) {
      toast.error("Este producto ya está en la venta", {
        description: "Si necesitas más cantidad, edita el producto existente",
        duration: 3000
      })
      return
    }

    setProductItems([...productItems, item])
    setShowProductCard(false)
    setSelectedProduct(null)
    setSelectedWarehouseId("")
    setShowProductSearch(true) // Mantener búsqueda visible
    toast.success("Producto agregado", {
      description: `${item.productName} agregado a la venta`,
      duration: 2000
    })
  }

  const handleProductRemove = (index: number) => {
    const newItems = productItems.filter((_, i) => i !== index)
    setProductItems(newItems)
    // Si no quedan productos, mostrar la búsqueda
    if (newItems.length === 0) {
      setShowProductSearch(true)
    }
  }

  const handleProductEdit = (index: number) => {
    const item = productItems[index]
    // Buscar el producto completo con stock incluido
    fetch(`/api/products/${item.productId}`)
      .then(res => res.json())
      .then(productData => {
        // Verificar que el producto tenga la estructura correcta
        if (!productData || !productData.id) {
          throw new Error("Producto no encontrado")
        }
        
        // Asegurar que el stock tenga la estructura correcta
        if (!productData.stock || !Array.isArray(productData.stock)) {
          productData.stock = []
        }
        
        // Verificar que el stock tenga el warehouse correcto
        const hasStockForWarehouse = productData.stock.some(
          (s: any) => s.warehouse && s.warehouse.id === item.warehouseId
        )
        
        if (!hasStockForWarehouse && productData.stock.length > 0) {
          // Si no hay stock para esta bodega, agregar un registro vacío para evitar errores
          productData.stock.push({
            warehouse: {
              id: item.warehouseId,
              name: item.warehouseName
            },
            quantity: 0
          })
        }
        
        setSelectedProduct(productData)
        setSelectedWarehouseId(item.warehouseId)
        setShowProductCard(true)
        // Remover el item actual para que se pueda re-agregar con los nuevos valores
        setProductItems(prev => prev.filter((_, i) => i !== index))
      })
      .catch(error => {
        console.error("Error cargando producto:", error)
        toast.error("Error al cargar el producto para editar", {
          description: error.message || "Por favor, intenta nuevamente"
        })
      })
  }

  const handleProductCardCancel = () => {
    setShowProductCard(false)
    setSelectedProduct(null)
    setSelectedWarehouseId("")
    setShowProductSearch(true) // Mostrar búsqueda al cancelar
  }

  const [isEditingCustomer, setIsEditingCustomer] = useState(false)

  const handleAddAnotherProduct = () => {
    setShowProductSearch(true)
    // Enfocar el input después de un pequeño delay para que se renderice
    setTimeout(() => {
      const input = document.querySelector('input[placeholder="Buscar por producto o bodega..."]') as HTMLInputElement
      if (input) {
        input.focus()
      }
    }, 100)
  }

  const handleStockAdded = async () => {
    // Recargar el producto para actualizar el stock
    if (selectedProduct && selectedWarehouseId) {
      try {
        const res = await fetch(`/api/products/${selectedProduct.id}`)
        if (res.ok) {
          const updatedProduct = await res.json()
          setSelectedProduct(updatedProduct)
        }
      } catch (error) {
        console.error("Error recargando producto:", error)
      }
    }
  }

  const onSubmit = async (data: SaleFormData) => {
    if (productItems.length === 0) {
      toast.error("Debes agregar al menos un producto a la venta")
      return
    }

    setLoading(true)
    try {
      // Calcular distribución de crédito si es mixto
      let cashDistribution: number[] = []
      let creditDistribution: number[] = []
      
      if (data.paymentType === "mixed" && data.cashAmount && data.creditAmount) {
        const cashPercent = (data.cashAmount / subtotal) * 100
        const creditPercent = (data.creditAmount / subtotal) * 100
        
        productItems.forEach(item => {
          const itemTotal = item.unitPrice * item.quantity
          cashDistribution.push((itemTotal * cashPercent) / 100)
          creditDistribution.push((itemTotal * creditPercent) / 100)
        })
      } else if (data.paymentType === "credit") {
        // Todo en crédito
        productItems.forEach(item => {
          const itemTotal = item.unitPrice * item.quantity
          cashDistribution.push(0)
          creditDistribution.push(itemTotal)
        })
      } else {
        // Todo en contado
        productItems.forEach(item => {
          const itemTotal = item.unitPrice * item.quantity
          cashDistribution.push(itemTotal)
          creditDistribution.push(0)
        })
      }

      // Crear un movimiento por cada producto (secuencialmente para evitar conflictos de número de movimiento)
      const movements = []
      for (let index = 0; index < productItems.length; index++) {
        const item = productItems[index]
          const payload = {
            companyId,
            customerId: data.customerId,
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            paymentType: data.paymentType,
            cashAmount: cashDistribution[index],
            creditAmount: creditDistribution[index],
            creditDays: data.paymentType === "credit" || data.paymentType === "mixed" ? data.creditDays : undefined,
            hasShipping: index === 0 ? data.hasShipping : false, // Solo el primer producto tiene envío
            shippingCost: index === 0 ? data.shippingCost : undefined,
            shippingPaidBy: index === 0 ? data.shippingPaidBy : undefined,
            notes: index === 0 ? data.notes : undefined // Solo el primer producto tiene notas
          }

        const res = await fetch("/api/movements/sale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || `Error al registrar venta de ${item.productName}`)
        }

        const result = await res.json()
        movements.push(result)
      }

      toast.success("✅ Venta registrada exitosamente", {
        description: `${productItems.length} producto(s) vendido(s)`,
        duration: 3000
      })
      
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
      {/* Cliente (Obligatorio) */}
      <div className={customerId && !isEditingCustomer ? "opacity-60 transition-opacity" : "opacity-100 transition-opacity"}>
        <div className="flex justify-between items-center mb-2">
          <Label>Cliente *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const searchValue = "" // No hay campo de búsqueda visible, abrir modal vacío
              setShowCreateCustomer(true)
            }}
          >
            + Crear Cliente
          </Button>
        </div>
        <CustomerSearch
          companyId={companyId}
          onSelect={(customer) => {
            setValue("customerId", customer.id, { shouldValidate: true })
            setIsEditingCustomer(false)
          }}
          onCreateNew={(name) => {
            // Guardar el nombre para pre-llenar el formulario
            setQuickCustomerName(name)
            setShowCreateCustomer(true)
          }}
          placeholder="Buscar cliente..."
          onFocus={() => setIsEditingCustomer(true)}
          onBlur={() => {
            // Pequeño delay para permitir que el onSelect se ejecute primero
            setTimeout(() => {
              if (customerId) {
                setIsEditingCustomer(false)
              }
            }, 100)
          }}
        />
        <input
          type="hidden"
          {...register("customerId", { required: "Cliente es obligatorio" })}
        />
        {errors.customerId && (
          <p className="text-sm text-red-500 mt-1">{errors.customerId.message}</p>
        )}
      </div>

      {/* Separador visual */}
      <div className="border-t my-6"></div>

      {/* Selección de Productos - Siempre visible */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Agregar Producto</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuickProductName("")
              setShowQuickProductCreation(true)
            }}
          >
            + Crear Producto
          </Button>
        </div>
        {showProductSearch && (
          <ProductSearchWithWarehouse
            companyId={companyId}
            onSelect={handleProductSelect}
            onCreateNew={(name) => {
              setQuickProductName(name)
              setShowQuickProductCreation(true)
            }}
            placeholder="Buscar por producto o bodega..."
            excludedProductIds={productItems.map(item => `${item.productId}-${item.warehouseId}`)}
          />
        )}
      </div>

      {/* Tarjeta de Configuración de Producto */}
      {showProductCard && selectedProduct && selectedWarehouseId && (
        <ProductSaleCard
          product={selectedProduct}
          warehouseId={selectedWarehouseId}
          warehouseName={warehouses.find(w => w.id === selectedWarehouseId)?.name || ""}
          companyId={companyId}
          stockQuantity={
            selectedProduct.stock && Array.isArray(selectedProduct.stock)
              ? selectedProduct.stock.find((s: any) => s.warehouse && s.warehouse.id === selectedWarehouseId)?.quantity || 0
              : 0
          }
          onSave={handleProductSave}
          onCancel={handleProductCardCancel}
          onRemove={handleProductCardCancel}
          onStockAdded={handleStockAdded}
        />
      )}

      {/* Resumen de Productos */}
      {productItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Productos en la Venta ({productItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {productItems.map((item, index) => (
                <div
                  key={`${item.productId}-${item.warehouseId}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.warehouseName} • {item.quantity} x ${item.unitPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} = ${(item.unitPrice * item.quantity).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProductEdit(index)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Editar producto"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProductRemove(index)}
                      className="text-red-600 hover:text-red-700"
                      title="Eliminar producto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {/* Botón para añadir otro producto */}
            <div className="mt-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddAnotherProduct}
                className="w-full"
              >
                <Package className="h-4 w-4 mr-2" />
                Añadir otro producto
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Subtotal:</span>
                <span>${subtotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tipo de Pago */}
      {productItems.length > 0 && (
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
                setValue("paymentType", "cash", { shouldValidate: true })
                setValue("cashAmount", undefined)
                setValue("creditAmount", undefined)
                setValue("creditDays", undefined)
                setForceUpdate(prev => prev + 1)
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
                setValue("paymentType", "credit", { shouldValidate: true })
                if (subtotal > 0) {
                  setValue("creditAmount", subtotal, { shouldValidate: true })
                }
                setValue("cashAmount", undefined)
                const currentDays = watch("creditDays")
                if (!currentDays || currentDays <= 0) {
                  setValue("creditDays", 15, { shouldValidate: true })
                  setCreditDaysType("preset")
                }
                setForceUpdate(prev => prev + 1)
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
                setValue("paymentType", "mixed", { shouldValidate: true })
                const currentCash = watch("cashAmount")
                const currentCredit = watch("creditAmount")
                if ((!currentCash || currentCash === 0) && (!currentCredit || currentCredit === 0)) {
                  if (subtotal > 0) {
                    setValue("cashAmount", subtotal / 2, { shouldValidate: true })
                    setValue("creditAmount", subtotal / 2, { shouldValidate: true })
                  }
                }
                const currentDays = watch("creditDays")
                if (!currentDays || currentDays <= 0) {
                  setValue("creditDays", 15, { shouldValidate: true })
                  setCreditDaysType("preset")
                }
                setForceUpdate(prev => prev + 1)
              }}
            >
              Mixto
            </Button>
          </div>

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
                    inputMode="numeric"
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
                    <CurrencyInput
                      value={watch("cashAmount") || 0}
                      onChange={(val) => {
                        setValue("cashAmount", val, { shouldValidate: true })
                        const credit = subtotal - val
                        setValue("creditAmount", credit > 0 ? credit : 0, { shouldValidate: true })
                      }}
                      placeholder="500,000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: ${subtotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} - Crédito: ${(watch("creditAmount") || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </p>
                  </div>
                  <div>
                    <Label>Crédito (COP)</Label>
                    <CurrencyInput
                      value={watch("creditAmount") || 0}
                      onChange={(val) => {
                        setValue("creditAmount", val, { shouldValidate: true })
                        const cash = subtotal - val
                        setValue("cashAmount", cash > 0 ? cash : 0, { shouldValidate: true })
                      }}
                      placeholder="500,000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: ${subtotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} - Contado: ${(watch("cashAmount") || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </p>
                  </div>
                </>
              )}

              {/* Para crédito puro */}
              {paymentType === "credit" && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Monto a crédito:</span> ${subtotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este monto se distribuirá proporcionalmente entre todos los productos
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Envío */}
      {productItems.length > 0 && (
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
                <CurrencyInput
                  value={watch("shippingCost") || 0}
                  onChange={(val) => setValue("shippingCost", val, { shouldValidate: true })}
                  placeholder="50,000"
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
      )}

      {/* Notas */}
      {productItems.length > 0 && (
        <div>
          <Label>Notas (Opcional)</Label>
          <textarea
            {...register("notes")}
            className="w-full border rounded-md p-2 text-base"
            rows={3}
          />
        </div>
      )}

      {/* Submit */}
      {productItems.length > 0 && (
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
      )}
    </form>

    {/* Modales */}
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
              customer={quickCustomerName ? { id: "", name: quickCustomerName, phone: "", address: "" } as any : undefined}
              onSuccess={(newCustomer) => {
                if (newCustomer) {
                  const updatedCustomers = [...customers, newCustomer]
                  setCustomers(updatedCustomers)
                  setValue("customerId", newCustomer.id, { shouldValidate: true })
                  onCustomerCreated?.(newCustomer)
                  setShowCreateCustomer(false)
                  setQuickCustomerName("") // Limpiar
                  toast.success("✅ Cliente creado y seleccionado", {
                    description: `"${newCustomer.name}" está ahora seleccionado`,
                    duration: 3000
                  })
                }
              }}
              onCancel={() => {
                setShowCreateCustomer(false)
                setQuickCustomerName("") // Limpiar
              }}
            />
          </CardContent>
        </Card>
      </div>
    )}

    {showQuickProductCreation && (
      <QuickProductCreationModal
        companyId={companyId}
        warehouses={warehouses}
        initialProductName={quickProductName}
        onSuccess={async (productId) => {
          setShowQuickProductCreation(false)
          try {
            const res = await fetch(`/api/companies/${companyId}/products`)
            if (res.ok) {
              const products = await res.json()
              const newProduct = products.find((p: any) => p.id === productId)
              if (newProduct) {
                // Buscar la primera bodega con stock o la primera disponible
                const stockItem = newProduct.stock.find((s: any) => s.quantity > 0) || newProduct.stock[0]
                if (stockItem) {
                  handleProductSelect(newProduct, stockItem.warehouse.id)
                } else {
                  toast.info("Producto creado", {
                    description: "Agrega stock en una bodega para poder venderlo",
                    duration: 3000
                  })
                }
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


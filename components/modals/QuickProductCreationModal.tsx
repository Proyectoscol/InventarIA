"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, purchaseSchema } from "@/lib/validations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { CurrencyInput } from "@/components/shared/CurrencyInput"
import { toast } from "sonner"
import { X, ChevronLeft, ChevronRight, Package, ShoppingCart } from "lucide-react"

type ProductFormData = {
  name: string
  description?: string
  imageBase64?: string
  minStockThreshold: number
}

type PurchaseFormData = {
  warehouseId: string
  quantity: number
  price: number
  priceType: "unit" | "total"
  notes?: string
}

// Schema de validación para compra sin productId (ya lo tenemos en el estado)
const purchaseFormSchema = purchaseSchema.omit({ productId: true })

interface QuickProductCreationModalProps {
  companyId: string
  warehouses: Array<{ id: string; name: string }>
  initialProductName?: string
  onSuccess: (productId: string) => void
  onCancel: () => void
}

export function QuickProductCreationModal({
  companyId,
  warehouses,
  initialProductName = "",
  onSuccess,
  onCancel
}: QuickProductCreationModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Formulario de producto (Paso 1)
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialProductName,
      description: "",
      imageBase64: "",
      minStockThreshold: 10
    }
  })

  // Formulario de compra (Paso 2)
  const purchaseForm = useForm<Omit<PurchaseFormData, "productId">>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      priceType: "unit"
    }
  })

  const priceType = purchaseForm.watch("priceType")
  const quantity = purchaseForm.watch("quantity")
  const price = purchaseForm.watch("price")

  const unitPrice = priceType === "unit" ? price : (quantity > 0 ? price / quantity : 0)

  // Paso 1: Crear producto
  const onProductSubmit = async (data: ProductFormData) => {
    // Validar que el nombre esté lleno
    if (!data.name || data.name.trim().length === 0) {
      toast.error("❌ El nombre del producto es requerido")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          companyId
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear producto")
      }

      const newProduct = await res.json()
      setCreatedProductId(newProduct.id)
      toast.success("✅ Producto creado exitosamente", {
        description: "Ahora registra la compra inicial para agregar stock",
        duration: 3000
      })
      setStep(2)
    } catch (error: any) {
      toast.error("❌ Error al crear producto", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  // Paso 2: Registrar compra inicial
  const onPurchaseSubmit = async (data: Omit<PurchaseFormData, "productId">) => {
    if (!createdProductId) {
      toast.error("Error: No se encontró el producto creado")
      return
    }

    // Validar campos requeridos
    if (!data.warehouseId) {
      toast.error("❌ Debes seleccionar una bodega")
      return
    }
    if (!data.quantity || data.quantity <= 0) {
      toast.error("❌ La cantidad debe ser mayor a 0")
      return
    }
    if (!price || price <= 0) {
      toast.error("❌ El precio debe ser mayor a 0")
      return
    }

    setLoading(true)
    try {
      const unitCost = priceType === "unit" ? price : (quantity > 0 ? price / quantity : 0)

      const res = await fetch("/api/movements/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: data.warehouseId,
          productId: createdProductId,
          quantity: data.quantity,
          price: unitCost,
          priceType: "unit", // Siempre enviar como unitario al backend
          paymentType: "cash", // Las compras siempre son de contado
          notes: data.notes,
          companyId
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al registrar compra")
      }

      toast.success("✅ Compra inicial registrada exitosamente", {
        description: "El producto está listo para vender",
        duration: 3000
      })

      // Cerrar modal y notificar éxito
      setTimeout(() => {
        onSuccess(createdProductId)
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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Solo cerrar si se hace clic en el fondo, no en el contenido del modal
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'}`}>
                  {step === 1 ? <Package className="h-4 w-4" /> : '✓'}
                </div>
                <div className="h-8 w-12 border-t-2 border-dashed border-gray-300" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-primary text-primary-foreground' : step === 1 ? 'bg-gray-200 text-gray-500' : 'bg-green-500 text-white'}`}>
                  {step === 2 ? <ShoppingCart className="h-4 w-4" /> : step === 1 ? '2' : '✓'}
                </div>
              </div>
              <CardTitle>
                {step === 1 ? "Paso 1: Crear Producto" : "Paso 2: Registrar Compra Inicial"}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {step === 1 ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                productForm.handleSubmit(onProductSubmit)(e)
              }} 
              className="space-y-6"
            >
              <div>
                <Label htmlFor="name" className="text-base">Nombre del Producto *</Label>
                <Input
                  id="name"
                  {...productForm.register("name")}
                  placeholder="Ej: Pelota Azul"
                />
                {productForm.formState.errors.name && (
                  <p className="text-base text-red-500 mt-1">{productForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-base">Descripción</Label>
                <textarea
                  id="description"
                  {...productForm.register("description")}
                  className="w-full border rounded-md p-2 text-base"
                  rows={3}
                  placeholder="Descripción opcional del producto"
                />
              </div>

              <div>
                <Label className="text-base">Imagen del Producto</Label>
                <ImageUpload
                  value={productForm.watch("imageBase64")}
                  onChange={(base64) => productForm.setValue("imageBase64", base64 || "")}
                />
              </div>

              <div>
                <Label htmlFor="minStockThreshold" className="text-base">Umbral Mínimo de Stock</Label>
                <Input
                  id="minStockThreshold"
                  type="number"
                  {...productForm.register("minStockThreshold", { valueAsNumber: true })}
                  placeholder="10"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Se enviará una alerta cuando el stock esté por debajo de este número
                </p>
                {productForm.formState.errors.minStockThreshold && (
                  <p className="text-base text-red-500 mt-1">{productForm.formState.errors.minStockThreshold.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creando..." : (
                    <>
                      Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form 
              onSubmit={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                const isValid = await purchaseForm.trigger()
                if (isValid) {
                  const data = purchaseForm.getValues()
                  await onPurchaseSubmit(data)
                }
              }} 
              className="space-y-6"
            >
              <div>
                <Label className="text-base">Bodega *</Label>
                <Select {...purchaseForm.register("warehouseId")} required>
                  <option value="">Seleccionar...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </Select>
                {purchaseForm.formState.errors.warehouseId && (
                  <p className="text-base text-red-500">{purchaseForm.formState.errors.warehouseId.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base">Cantidad *</Label>
                <Input
                  type="number"
                  min="1"
                  {...purchaseForm.register("quantity", { valueAsNumber: true })}
                  placeholder="0"
                  required
                />
                {purchaseForm.formState.errors.quantity && (
                  <p className="text-base text-red-500">{purchaseForm.formState.errors.quantity.message}</p>
                )}
              </div>

              <div>
                <Label className="mb-2 block text-base">Tipo de Precio</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={priceType === "unit" ? "default" : "outline"}
                    className={`h-12 text-base font-medium ${
                      priceType === "unit" ? "bg-primary text-white" : ""
                    }`}
                    onClick={() => purchaseForm.setValue("priceType", "unit", { shouldValidate: true })}
                  >
                    Precio Unitario
                  </Button>
                  <Button
                    type="button"
                    variant={priceType === "total" ? "default" : "outline"}
                    className={`h-12 text-base font-medium ${
                      priceType === "total" ? "bg-primary text-white" : ""
                    }`}
                    onClick={() => purchaseForm.setValue("priceType", "total", { shouldValidate: true })}
                  >
                    Precio Total
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-base">
                  {priceType === "unit" ? "Precio Unitario (COP) *" : "Precio Total (COP) *"}
                </Label>
                <CurrencyInput
                  value={price || 0}
                  onChange={(val) => purchaseForm.setValue("price", val, { shouldValidate: true })}
                />
                {priceType === "total" && quantity && (
                  <p className="text-base text-muted-foreground mt-1">
                    Precio unitario: ${unitPrice.toLocaleString("es-CO")} COP
                  </p>
                )}
                {purchaseForm.formState.errors.price && (
                  <p className="text-base text-red-500">{purchaseForm.formState.errors.price.message}</p>
                )}
              </div>


              <div>
                <Label className="text-base">Notas (Opcional)</Label>
                <textarea
                  {...purchaseForm.register("notes")}
                  className="w-full border rounded-md p-2 text-base"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Registrando..." : (
                    <>
                      ✅ Finalizar
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


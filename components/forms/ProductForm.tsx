"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/shared/ImageUpload"
import { toast } from "sonner"
import { Product } from "@/types"

type ProductFormData = {
  name: string
  description?: string
  imageBase64?: string
  minStockThreshold: number
}

interface ProductFormProps {
  companyId: string
  product?: Product
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProductForm({ companyId, product, onSuccess, onCancel }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      imageBase64: product?.imageBase64 || "",
      minStockThreshold: product?.minStockThreshold || 10
    }
  })

  const imageBase64 = watch("imageBase64")

  const onSubmit = async (data: ProductFormData) => {
    try {
      const url = product 
        ? `/api/products/${product.id}`
        : `/api/products`
      
      const method = product ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          companyId
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al guardar producto")
      }

      toast.success(product ? "✅ Producto actualizado" : "✅ Producto creado exitosamente", {
        description: product ? "Los cambios se han guardado" : "El producto se ha agregado al inventario",
        duration: 3000
      })
      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        onSuccess?.()
      }, 500)
    } catch (error: any) {
      toast.error("❌ Error al guardar producto", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Nombre del Producto *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ej: Pelota Azul"
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          {...register("description")}
          className="w-full border rounded-md p-2 text-base"
          rows={3}
          placeholder="Descripción opcional del producto"
        />
      </div>

      <div>
        <Label>Imagen del Producto</Label>
        <ImageUpload
          value={imageBase64}
          onChange={(base64) => setValue("imageBase64", base64 || "")}
        />
      </div>

      <div>
        <Label htmlFor="minStockThreshold">Umbral Mínimo de Stock</Label>
        <Input
          id="minStockThreshold"
          type="number"
          {...register("minStockThreshold", { valueAsNumber: true })}
          placeholder="10"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Se enviará una alerta cuando el stock esté por debajo de este número
        </p>
        {errors.minStockThreshold && (
          <p className="text-sm text-red-500 mt-1">{errors.minStockThreshold.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Guardando...
            </>
          ) : product ? (
            "✅ Actualizar Producto"
          ) : (
            "✅ Crear Producto"
          )}
        </Button>
      </div>
    </form>
  )
}


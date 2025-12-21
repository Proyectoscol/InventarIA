"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { warehouseSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Warehouse } from "@/types"

type WarehouseFormData = {
  name: string
  description?: string
}

interface WarehouseFormProps {
  companyId: string
  warehouse?: Warehouse
  onSuccess?: () => void
  onCancel?: () => void
}

export function WarehouseForm({ companyId, warehouse, onSuccess, onCancel }: WarehouseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse?.name || "",
      description: warehouse?.description || ""
    }
  })

  const onSubmit = async (data: WarehouseFormData) => {
    try {
      const url = warehouse
        ? `/api/warehouses/${warehouse.id}`
        : `/api/companies/${companyId}/warehouses`
      
      const method = warehouse ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al guardar bodega")
      }

      toast.success(warehouse ? "Bodega actualizada" : "Bodega creada exitosamente")
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || "Error al guardar bodega")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre de la Bodega *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ej: Bodega Principal"
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
          className="w-full border rounded-md p-2"
          rows={3}
          placeholder="Descripción opcional de la bodega"
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Guardando..." : warehouse ? "Actualizar" : "Crear Bodega"}
        </Button>
      </div>
    </form>
  )
}


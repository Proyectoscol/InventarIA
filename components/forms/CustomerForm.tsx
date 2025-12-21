"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { customerSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Customer } from "@/types"

type CustomerFormData = {
  name: string
  email?: string
  phone?: string
  address?: string
}

interface CustomerFormProps {
  companyId: string
  customer?: Customer
  onSuccess?: () => void
  onCancel?: () => void
}

export function CustomerForm({ companyId, customer, onSuccess, onCancel }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || ""
    }
  })

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const url = customer
        ? `/api/customers/${customer.id}`
        : `/api/companies/${companyId}/customers`
      
      const method = customer ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al guardar cliente")
      }

      toast.success(customer ? "Cliente actualizado" : "Cliente creado exitosamente")
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || "Error al guardar cliente")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre del Cliente *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ej: Juan Pérez"
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="cliente@email.com"
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="+57 300 123 4567"
        />
      </div>

      <div>
        <Label htmlFor="address">Dirección</Label>
        <textarea
          id="address"
          {...register("address")}
          className="w-full border rounded-md p-2"
          rows={3}
          placeholder="Dirección del cliente"
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Guardando..." : customer ? "Actualizar" : "Crear Cliente"}
        </Button>
      </div>
    </form>
  )
}


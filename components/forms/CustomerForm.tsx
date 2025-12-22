"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { customerSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Customer } from "@/types"
import { ContactRound } from "lucide-react"

type CustomerFormData = {
  name: string
  email?: string
  phone?: string
  address?: string
}

interface CustomerFormProps {
  companyId: string
  customer?: Customer
  onSuccess?: (customer?: Customer) => void
  onCancel?: () => void
}

export function CustomerForm({ companyId, customer, onSuccess, onCancel }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
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

  // Verificar si la Contact Picker API está disponible
  const isContactPickerAvailable = () => {
    return 'contacts' in navigator && 'ContactsManager' in window
  }

  // Importar contacto desde el dispositivo
  const handleImportContact = async () => {
    try {
      // Verificar disponibilidad
      if (!isContactPickerAvailable()) {
        toast.error("❌ Función no disponible", {
          description: "La importación de contactos no está disponible en este dispositivo o navegador. Por favor, ingresa los datos manualmente.",
          duration: 4000
        })
        return
      }

      // Solicitar acceso a contactos (solo nombre y teléfono)
      const contactsManager = (navigator as any).contacts
      const contacts = await contactsManager.select(['name', 'tel'], {
        multiple: false // Solo permitir seleccionar un contacto a la vez
      })

      if (contacts && contacts.length > 0) {
        const contact = contacts[0]
        
        // Extraer nombre
        if (contact.name && contact.name.length > 0) {
          const name = Array.isArray(contact.name) ? contact.name[0] : contact.name
          setValue("name", name)
        }

        // Extraer teléfono
        if (contact.tel && contact.tel.length > 0) {
          const phone = Array.isArray(contact.tel) ? contact.tel[0] : contact.tel
          setValue("phone", phone)
        }

        toast.success("✅ Contacto importado", {
          description: "Los datos del contacto se han cargado en el formulario",
          duration: 3000
        })
      }
    } catch (error: any) {
      // El usuario canceló la selección o hubo un error
      if (error.name === 'AbortError' || error.name === 'NotAllowedError') {
        // Usuario canceló o no dio permisos - no mostrar error
        return
      }
      console.error("Error importando contacto:", error)
      toast.error("❌ Error al importar contacto", {
        description: "No se pudo importar el contacto. Por favor, ingresa los datos manualmente.",
        duration: 4000
      })
    }
  }

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

      const savedCustomer = await res.json()
      toast.success(customer ? "✅ Cliente actualizado" : "✅ Cliente creado exitosamente", {
        description: customer ? "Los cambios se han guardado" : "El cliente se ha agregado correctamente",
        duration: 3000
      })
      onSuccess?.(savedCustomer)
    } catch (error: any) {
      toast.error("❌ Error al guardar cliente", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Botón para importar contacto - solo mostrar si está disponible y no es edición */}
      {!customer && isContactPickerAvailable() && (
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleImportContact}
            className="w-full"
          >
            <ContactRound className="mr-2 h-4 w-4" />
            Importar desde Contactos
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Selecciona un contacto de tu iPhone para llenar automáticamente el formulario
          </p>
        </div>
      )}

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
          className="w-full border rounded-md p-2 text-base"
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
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Guardando...
            </>
          ) : customer ? (
            "✅ Actualizar Cliente"
          ) : (
            "✅ Crear Cliente"
          )}
        </Button>
      </div>
    </form>
  )
}


"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { companySchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Company } from "@/types"
import { useState } from "react"

type CompanyFormData = {
  name: string
  alertEmails?: string[]
  enableAlerts?: boolean
}

interface CompanyFormProps {
  company?: Company
  onSuccess?: () => void
  onCancel?: () => void
}

export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [emailInput, setEmailInput] = useState("")
  const [emails, setEmails] = useState<string[]>(company ? [] : [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || "",
      enableAlerts: true
    }
  })

  const addEmail = () => {
    if (emailInput && !emails.includes(emailInput)) {
      const newEmails = [...emails, emailInput]
      setEmails(newEmails)
      setValue("alertEmails", newEmails)
      setEmailInput("")
    }
  }

  const removeEmail = (email: string) => {
    const newEmails = emails.filter(e => e !== email)
    setEmails(newEmails)
    setValue("alertEmails", newEmails)
  }

  const onSubmit = async (data: CompanyFormData) => {
    try {
      const url = company ? `/api/companies/${company.id}` : `/api/companies`
      const method = company ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          alertEmails: emails
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al guardar compañía")
      }

      toast.success(company ? "Compañía actualizada" : "Compañía creada exitosamente")
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || "Error al guardar compañía")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Nombre de la Compañía *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ej: Deportes XYZ"
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label>Emails para Alertas</Label>
        <div className="flex gap-2 mb-2">
          <Input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="email@ejemplo.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addEmail()
              }
            }}
          />
          <Button type="button" onClick={addEmail} variant="outline">
            Agregar
          </Button>
        </div>
        {emails.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {emails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Agrega emails que recibirán alertas cuando el stock esté bajo
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="enableAlerts"
          {...register("enableAlerts")}
          className="h-4 w-4"
        />
        <Label htmlFor="enableAlerts">Activar alertas por email</Label>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Guardando..." : company ? "Actualizar" : "Crear Compañía"}
        </Button>
      </div>
    </form>
  )
}


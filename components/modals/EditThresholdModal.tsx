"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { X } from "lucide-react"

interface EditThresholdModalProps {
  productId: string
  productName: string
  currentThreshold: number
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditThresholdModal({
  productId,
  productName,
  currentThreshold,
  open,
  onClose,
  onSuccess
}: EditThresholdModalProps) {
  const [threshold, setThreshold] = useState(currentThreshold.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const thresholdNum = parseInt(threshold)
    
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      toast.error("El umbral debe ser un número mayor o igual a 0")
      return
    }

    setIsSubmitting(true)
    try {
      // Actualizar solo el umbral mínimo del producto
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minStockThreshold: thresholdNum
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al actualizar umbral")
      }

      toast.success("✅ Umbral actualizado exitosamente", {
        description: `El umbral mínimo para ${productName} se ha actualizado a ${thresholdNum} unidades`,
        duration: 3000
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error("❌ Error al actualizar umbral", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <Card 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Editar Umbral Mínimo</CardTitle>
              <CardDescription className="mt-1">
                Configura el umbral mínimo de stock para {productName}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="threshold">Umbral Mínimo (unidades)</Label>
              <Input
                id="threshold"
                type="number"
                inputMode="numeric"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                required
                className="text-base"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Se enviará una alerta cuando el stock esté por debajo de este valor
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/forms/ProductForm"
import { Product } from "@/types"
import { X } from "lucide-react"

interface EditProductModalProps {
  product: Product
  companyId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditProductModal({
  product,
  companyId,
  open,
  onClose,
  onSuccess
}: EditProductModalProps) {
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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Editar Producto</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ProductForm
            companyId={companyId}
            product={product}
            onSuccess={() => {
              onSuccess()
              onClose()
            }}
            onCancel={onClose}
          />
        </CardContent>
      </Card>
    </div>
  )
}


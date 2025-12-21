"use client"

import { ProductCard } from "./ProductCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Package } from "lucide-react"
import { Product } from "@/types"

interface ProductListProps {
  products: Product[]
  onEdit?: (product: Product) => void
  onDelete?: (productId: string) => void
  onCreateNew?: () => void
}

export function ProductList({ products, onEdit, onDelete, onCreateNew }: ProductListProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No hay productos registrados"
        description="Crea tu primer producto para comenzar a gestionar tu inventario."
        action={onCreateNew ? {
          label: "Agregar Producto",
          onClick: onCreateNew
        } : undefined}
      />
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}


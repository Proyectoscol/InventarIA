"use client"

import { MovementCard } from "./MovementCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Receipt } from "lucide-react"
import { Movement } from "@/types"

interface MovementListProps {
  movements: Movement[]
  onEdit?: (movement: Movement) => void
  onReturn?: (movement: Movement) => void
}

export function MovementList({ movements, onEdit, onReturn }: MovementListProps) {
  if (movements.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No hay movimientos registrados"
        description="Comienza registrando una compra o venta."
      />
    )
  }
  
  return (
    <div className="space-y-4">
      {movements.map((movement) => (
        <MovementCard
          key={movement.id}
          movement={movement}
          onEdit={onEdit}
          onReturn={onReturn}
        />
      ))}
    </div>
  )
}


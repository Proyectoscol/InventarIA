"use client"

interface LowStockBadgeProps {
  currentStock: number
  threshold: number
}

export function LowStockBadge({ currentStock, threshold }: LowStockBadgeProps) {
  if (currentStock >= threshold) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <span>✅</span>
        <span>Stock saludable</span>
      </div>
    )
  }
  
  const deficit = threshold - currentStock
  
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
      <span>⚠️</span>
      <span>
        Stock bajo umbral ({threshold}) - Faltan {deficit} unidades
      </span>
    </div>
  )
}


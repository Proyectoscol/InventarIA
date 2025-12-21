"use client"

interface StockIndicatorProps {
  warehouseName: string
  quantity: number
  threshold: number
}

export function StockIndicator({ warehouseName, quantity, threshold }: StockIndicatorProps) {
  const isLow = quantity < threshold
  
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">🏢 {warehouseName}:</span>
      <span className={isLow ? "font-bold text-red-600" : "font-medium"}>
        {quantity} unidades
      </span>
    </div>
  )
}


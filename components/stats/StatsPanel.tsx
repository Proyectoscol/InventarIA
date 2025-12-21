"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { SalesChart } from "./SalesChart"
import { ProfitChart } from "./ProfitChart"
import { TopProducts } from "./TopProducts"
import { InventoryRotation } from "./InventoryRotation"

interface StatsPanelProps {
  companyId: string
  dateRange: { from: Date; to: Date }
  stats: {
    sales: {
      totalAmount: number
      cashAmount: number
      pendingCredit: number
      count: number
      byDay: Array<{ date: string; amount: number }>
    }
    profit: {
      totalRevenue: number
      totalCost: number
      netProfit: number
      margin: number
      topProducts: Array<{
        productName: string
        profit: number
        quantity: number
      }>
    }
  }
}

export function StatsPanel({ companyId, dateRange, stats }: StatsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Panel de Caja */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Panel de Caja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ventas Totales</p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.sales.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Efectivo</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.sales.cashAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Crédito Pendiente</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.sales.pendingCredit)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Utilidad */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Panel de Utilidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Costo Total</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.profit.totalCost)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ganancia Neta</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.profit.netProfit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Margen</p>
              <p className="text-2xl font-bold">
                {stats.profit.margin.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <SalesChart data={stats.sales.byDay} />
      <ProfitChart data={stats.profit.topProducts} />

      {/* Top Productos y Rotación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProducts products={stats.profit.topProducts} />
        <InventoryRotation companyId={companyId} />
      </div>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/shared/BackButton"
import { MovementCalendar } from "@/components/calendar/MovementCalendar"
import { DayDetailsModal } from "@/components/calendar/DayDetailsModal"

export default function StatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [companyId, setCompanyId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch("/api/companies")
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            setCompanyId(data[0].id)
            fetchStats(data[0].id)
          }
        })
    }
  }, [session])

  const fetchStats = async (compId: string) => {
    try {
      const from = new Date()
      from.setMonth(from.getMonth() - 1)
      const to = new Date()

      const [sales, profit, purchases, cashFlow, customers] = await Promise.all([
        fetch(`/api/reports/sales?companyId=${compId}&from=${from.toISOString()}&to=${to.toISOString()}`)
          .then(r => r.json()),
        fetch(`/api/reports/profit?companyId=${compId}&from=${from.toISOString()}&to=${to.toISOString()}`)
          .then(r => r.json()),
        fetch(`/api/reports/purchases?companyId=${compId}&from=${from.toISOString()}&to=${to.toISOString()}`)
          .then(r => r.json()),
        fetch(`/api/reports/cash-flow?companyId=${compId}&from=${from.toISOString()}&to=${to.toISOString()}`)
          .then(r => r.json()),
        fetch(`/api/reports/customers?companyId=${compId}&from=${from.toISOString()}&to=${to.toISOString()}`)
          .then(r => r.json())
      ])

      setStats({ sales, profit, purchases, cashFlow, customers: customers.customers || [] })
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  if (status === "loading" || !stats) {
    return <div className="p-8">Cargando...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <BackButton href="/dashboard" />
      </div>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Estadísticas y Reportes</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>💰 Ventas Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl font-bold">
                ${stats.sales.totalAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {stats.sales.count} movimientos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💵 Contado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                ${stats.sales.cashAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Ganancia Neta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl font-bold text-blue-600">
                ${stats.profit.netProfit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Margen: {stats.profit.margin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🏆 Top 5 Productos por Ganancia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.profit.topProducts.slice(0, 5).map((p: any, idx: number) => (
                <div key={p.productId} className="flex justify-between items-center p-2 border rounded">
                  <span>{idx + 1}. {p.productName}</span>
                  <span className="font-bold">${(Number(p.profit) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendario de Movimientos */}
        {companyId && (
          <div className="mb-8 -mx-2 sm:mx-0">
            <MovementCalendar
              companyId={companyId}
              onDateSelect={(date) => setSelectedDate(date)}
            />
          </div>
        )}

        {/* Nuevas Estadísticas después del calendario */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Compras Totales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">🛒 Compras Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">
                  ${(stats.purchases?.totalAmount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {stats.purchases?.count || 0} compras
                </p>
              </CardContent>
            </Card>

            {/* Crédito Pendiente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">💳 Crédito Pendiente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold text-orange-600">
                  ${(stats.sales?.pendingCredit || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Por cobrar
                </p>
              </CardContent>
            </Card>

            {/* Total Unidades Vendidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">📦 Unidades Vendidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold text-purple-600">
                  {(stats.sales?.totalQuantity || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  unidades
                </p>
              </CardContent>
            </Card>

            {/* Promedio de Venta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">📊 Promedio de Venta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold text-indigo-600">
                  ${stats.sales?.count > 0 
                    ? Math.round(stats.sales.totalAmount / stats.sales.count).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    : "0"}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  por movimiento
                </p>
              </CardContent>
            </Card>

            {/* Flujo de Caja Neto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">💵 Flujo de Caja Neto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl md:text-2xl font-bold ${
                  (stats.cashFlow?.netCashFlow || 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  ${(stats.cashFlow?.netCashFlow || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Entradas - Salidas
                </p>
              </CardContent>
            </Card>

            {/* Total Movimientos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">🔄 Total Movimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold text-cyan-600">
                  {(stats.sales?.count || 0) + (stats.purchases?.count || 0)}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {stats.sales?.count || 0} ventas, {stats.purchases?.count || 0} compras
                </p>
              </CardContent>
            </Card>

            {/* Total Ventas Realizadas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">📈 Total Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold text-emerald-600">
                  {stats.sales?.count || 0}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  movimientos de venta
                </p>
              </CardContent>
            </Card>

            {/* Total Compras Realizadas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">🛍️ Total Compras</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold text-amber-600">
                  {stats.purchases?.count || 0}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  movimientos de compra
                </p>
              </CardContent>
            </Card>

            {/* Margen de Ganancia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">📉 Margen de Ganancia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold text-teal-600">
                  {stats.profit?.margin?.toFixed(1) || "0.0"}%
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  sobre ventas totales
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabla de Mejores Clientess */}
        {stats && stats.customers && stats.customers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">🏆 Mejores Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 sm:p-3 font-semibold">Cliente</th>
                      <th className="text-right p-2 sm:p-3 font-semibold">Ventas</th>
                      <th className="text-right p-2 sm:p-3 font-semibold">Ganancia</th>
                      <th className="text-right p-2 sm:p-3 font-semibold">Crédito Pend.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.customers.slice(0, 10).map((customer: any, idx: number) => (
                      <tr key={customer.customer?.id || idx} className="border-b hover:bg-muted/50">
                        <td className="p-2 sm:p-3">
                          <div>
                            <p className="font-medium">{customer.customer?.name || "Sin nombre"}</p>
                            {customer.customer?.phone && (
                              <p className="text-xs text-muted-foreground">{customer.customer.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-right p-2 sm:p-3 font-semibold">
                          ${(customer.totalAmount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </td>
                        <td className="text-right p-2 sm:p-3 text-green-600">
                          ${(customer.totalProfit || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </td>
                        <td className="text-right p-2 sm:p-3 text-orange-600">
                          ${(customer.pendingCredits || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Modal de detalles del día */}
        {selectedDate && companyId && (
          <DayDetailsModal
            date={selectedDate}
            companyId={companyId}
            onClose={() => setSelectedDate(null)}
          />
        )}
    </div>
  )
}


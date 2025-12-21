"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/shared/BackButton"

export default function StatsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [companyId, setCompanyId] = useState<string>("")

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

      const [sales, profit] = await Promise.all([
        fetch(`/api/reports/sales?companyId=${compId}&from=${from.toISOString()}&to=${to.toISOString()}`)
          .then(r => r.json()),
        fetch(`/api/reports/profit?companyId=${compId}&from=${from.toISOString()}&to=${to.toISOString()}`)
          .then(r => r.json())
      ])

      setStats({ sales, profit })
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
              <p className="text-2xl font-bold">
                ${stats.sales.totalAmount.toLocaleString("es-CO")}
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.sales.count} movimientos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💵 Efectivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                ${stats.sales.cashAmount.toLocaleString("es-CO")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Ganancia Neta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                ${stats.profit.netProfit.toLocaleString("es-CO")}
              </p>
              <p className="text-sm text-muted-foreground">
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
                  <span className="font-bold">${p.profit.toLocaleString("es-CO")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
    </div>
  )
}


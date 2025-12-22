"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Edit, ShoppingCart, Package, ArrowUp, ArrowDown } from "lucide-react"
import { useRouter } from "next/navigation"

interface DayDetailsModalProps {
  date: Date
  companyId: string
  onClose: () => void
}

export function DayDetailsModal({ date, companyId, onClose }: DayDetailsModalProps) {
  const [movements, setMovements] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDayMovements()
  }, [date, companyId])

  const fetchDayMovements = async () => {
    if (!companyId) return
    
    setLoading(true)
    try {
      const dateStr = date.toISOString().split("T")[0]
      const res = await fetch(
        `/api/movements/by-date?companyId=${companyId}&date=${dateStr}`
      )
      if (res.ok) {
        const data = await res.json()
        setMovements(data.movements)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error cargando movimientos del día:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const handleEditMovement = (movementId: string, type: string) => {
    if (type === "purchase") {
      router.push(`/dashboard/movements/purchase?edit=${movementId}`)
    } else {
      router.push(`/dashboard/movements/sale?edit=${movementId}`)
    }
    onClose()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
          <CardContent className="p-8 text-center">
            <p>Cargando...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{formatDate(date)}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumen del día */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos (Ventas)</p>
                <p className="text-xl font-bold text-green-600">
                  ${summary.totalSales.toLocaleString("es-CO")} COP
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.salesCount} venta{summary.salesCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Egresos (Compras)</p>
                <p className="text-xl font-bold text-red-600">
                  ${summary.totalPurchases.toLocaleString("es-CO")} COP
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.purchasesCount} compra{summary.purchasesCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ganancia Neta</p>
                <p className="text-xl font-bold text-blue-600">
                  ${summary.totalProfit.toLocaleString("es-CO")} COP
                </p>
                <p className="text-xs text-muted-foreground">
                  Balance: ${(summary.totalSales - summary.totalPurchases).toLocaleString("es-CO")}
                </p>
              </div>
            </div>
          )}

          {/* Lista de movimientos */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg mb-3">Movimientos del día</h3>
            {movements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay movimientos registrados en este día
              </p>
            ) : (
              movements.map((movement) => (
                <Card
                  key={movement.id}
                  className={`${
                    movement.type === "sale"
                      ? "border-green-200 bg-green-50"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {movement.type === "sale" ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="font-semibold">
                            {movement.type === "sale" ? "Venta" : "Compra"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(movement.movementDate)}
                          </span>
                          <span className="text-xs bg-white px-2 py-1 rounded">
                            {movement.movementNumber}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Producto:</span> {movement.product?.name}
                          </p>
                          <p>
                            <span className="font-medium">Bodega:</span> {movement.warehouse?.name}
                          </p>
                          <p>
                            <span className="font-medium">Cantidad:</span> {movement.quantity} unidades
                          </p>
                          <p>
                            <span className="font-medium">Precio unitario:</span>{" "}
                            ${Number(movement.unitPrice).toLocaleString("es-CO")} COP
                          </p>
                          <p>
                            <span className="font-medium">Total:</span>{" "}
                            <span className="font-bold">
                              ${Number(movement.totalAmount).toLocaleString("es-CO")} COP
                            </span>
                          </p>
                          {movement.type === "sale" && movement.customer && (
                            <p>
                              <span className="font-medium">Cliente:</span> {movement.customer.name}
                            </p>
                          )}
                          {movement.type === "sale" && movement.profit && (
                            <p>
                              <span className="font-medium">Ganancia:</span>{" "}
                              <span className="text-green-600 font-semibold">
                                ${Number(movement.profit).toLocaleString("es-CO")} COP
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMovement(movement.id, movement.type)}
                        className="ml-4"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


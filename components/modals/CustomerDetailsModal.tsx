"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, ShoppingCart, DollarSign, TrendingUp, Package, Calendar, CreditCard, Edit } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Customer, Movement } from "@/types"

interface CustomerDetailsModalProps {
  customer: Customer
  companyId: string
  onClose: () => void
}

export function CustomerDetailsModal({ customer, companyId, onClose }: CustomerDetailsModalProps) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCustomerMovements()
  }, [customer.id, companyId])

  const fetchCustomerMovements = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customer.id}/movements?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setMovements(data.movements)
        setSummary(data.summary)
      } else {
        toast.error("Error al cargar movimientos del cliente.")
      }
    } catch (error) {
      console.error("Error fetching customer movements:", error)
      toast.error("Error de red al cargar movimientos del cliente.")
    } finally {
      setLoading(false)
    }
  }

  const handleEditMovement = (movementId: string) => {
    router.push(`/dashboard/movements/sale?edit=${movementId}`)
    onClose()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-6 text-center text-base">Cargando movimientos...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white z-10 border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{customer.name}</CardTitle>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {customer.phone && (
                  <p className="flex items-center gap-2">
                    📞 {customer.phone}
                  </p>
                )}
                {customer.address && (
                  <p className="flex items-center gap-2">
                    📍 {customer.address}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6 text-muted-foreground" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Resumen */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" /> Total Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">
                    ${summary.totalSales.toLocaleString("es-CO")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {summary.totalMovements} {summary.totalMovements === 1 ? "movimiento" : "movimientos"}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" /> Ganancia Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    ${summary.totalProfit.toLocaleString("es-CO")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {summary.totalQuantity} {summary.totalQuantity === 1 ? "unidad" : "unidades"}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-yellow-600" /> Efectivo Recibido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-700">
                    ${summary.totalCash.toLocaleString("es-CO")}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-600" /> Crédito Pendiente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">
                    ${summary.pendingCredit.toLocaleString("es-CO")}
                  </div>
                  {summary.totalCredit > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Total crédito: ${summary.totalCredit.toLocaleString("es-CO")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de Movimientos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Historial de Ventas</h3>
            {movements.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-base">
                    Este cliente no tiene movimientos registrados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {movements.map((movement) => (
                  <Card key={movement.id} className="border-green-100 bg-green-50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-lg">Venta</span>
                          <span className="text-sm text-muted-foreground">
                            ({format(new Date(movement.movementDate), "PPP 'a las' HH:mm", { locale: es })})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMovement(movement.id)}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-base">
                        <p><span className="font-medium">No. Movimiento:</span> {movement.movementNumber}</p>
                        <p><span className="font-medium">Producto:</span> {movement.product?.name}</p>
                        <p><span className="font-medium">Bodega:</span> {movement.warehouse?.name}</p>
                        <p><span className="font-medium">Cantidad:</span> {movement.quantity} unidades</p>
                        <p><span className="font-medium">Precio Unitario:</span> ${movement.unitPrice?.toLocaleString("es-CO")}</p>
                        <p><span className="font-medium">Total:</span> ${movement.totalAmount?.toLocaleString("es-CO")}</p>
                        {movement.profit !== null && (
                          <p><span className="font-medium">Ganancia:</span> ${movement.profit?.toLocaleString("es-CO")}</p>
                        )}
                        <p><span className="font-medium">Pago:</span> {
                          movement.paymentType === "cash" ? "Efectivo" :
                          movement.paymentType === "credit" ? "Crédito" :
                          "Mixto"
                        }</p>
                        {movement.paymentType === "mixed" && (
                          <>
                            <p><span className="font-medium">Efectivo:</span> ${movement.cashAmount?.toLocaleString("es-CO")}</p>
                            <p><span className="font-medium">Crédito:</span> ${movement.creditAmount?.toLocaleString("es-CO")}</p>
                          </>
                        )}
                        {movement.hasShipping && movement.shippingCost && (
                          <p><span className="font-medium">Envío:</span> ${movement.shippingCost?.toLocaleString("es-CO")} 
                            ({movement.shippingPaidBy === "customer" ? "Cliente" : "Vendedor"})
                          </p>
                        )}
                        {movement.notes && (
                          <p className="col-span-2"><span className="font-medium">Notas:</span> {movement.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


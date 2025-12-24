"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/shared/BackButton"
import { toast } from "sonner"
import { Calendar, DollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { formatColombiaDate, formatColombiaTime } from "@/lib/date-utils"

export default function CreditsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [credits, setCredits] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "overdue" | "paid">("all")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchCompanies()
    }
  }, [session])

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCredits(selectedCompanyId, statusFilter)
    }
  }, [selectedCompanyId, statusFilter])

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies")
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
        if (data.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(data[0].id)
        }
      }
    } catch (error) {
      console.error("Error cargando compañías:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCredits = async (companyId: string, status: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/credits?companyId=${companyId}&status=${status}`)
      if (res.ok) {
        const data = await res.json()
        setCredits(data.credits)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error cargando créditos:", error)
      toast.error("Error cargando créditos")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (movementId: string, paidDate?: string) => {
    try {
      const res = await fetch(`/api/movements/${movementId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidDate: paidDate || new Date().toISOString()
        })
      })

      if (res.ok) {
        toast.success("✅ Crédito marcado como pagado", {
          description: "El crédito se ha registrado como pagado correctamente",
          duration: 3000
        })
        // Recargar créditos
        if (selectedCompanyId) {
          fetchCredits(selectedCompanyId, statusFilter)
        }
      } else {
        const error = await res.json()
        throw new Error(error.error || "Error al marcar como pagado")
      }
    } catch (error: any) {
      toast.error("❌ Error al marcar crédito como pagado", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    }
  }

  if (status === "loading" || loading) {
    return <div className="p-8">Cargando...</div>
  }

  if (!session) {
    return null
  }

  if (companies.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <BackButton href="/dashboard" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Créditos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Primero necesitas crear una compañía para poder gestionar créditos.
              </p>
              <Button onClick={() => router.push("/dashboard/settings/companies")}>
                Crear Compañía
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <BackButton href="/dashboard" />
        </div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Créditos</h1>
            <p className="text-muted-foreground mt-1">
              Administra créditos pendientes, vencidos y pagados
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seleccionar Compañía</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Compañía
              </label>
              <select
                id="company"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full p-2 border rounded-md text-base"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" /> Total Créditos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">
                  {summary.total}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" /> Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">
                  {summary.pending}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${summary.totalPendingAmount.toLocaleString("es-CO")}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" /> Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">
                  {summary.overdue}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${summary.totalOverdueAmount.toLocaleString("es-CO")}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" /> Pagados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {summary.paid}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                Pendientes
              </Button>
              <Button
                variant={statusFilter === "overdue" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("overdue")}
              >
                Vencidos
              </Button>
              <Button
                variant={statusFilter === "paid" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("paid")}
              >
                Pagados
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Créditos {statusFilter !== "all" && `(${statusFilter})`} ({credits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {credits.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-base">
                  No hay créditos {statusFilter !== "all" ? `con estado "${statusFilter}"` : "registrados"}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {credits.map((credit) => (
                  <Card 
                    key={credit.id} 
                    className={`border-l-4 ${
                      credit.status === "overdue" 
                        ? "border-red-500 bg-red-50" 
                        : credit.status === "paid"
                        ? "border-green-500 bg-green-50"
                        : "border-yellow-500 bg-yellow-50"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">{credit.movementNumber}</span>
                            {credit.status === "overdue" && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                                VENCIDO
                              </span>
                            )}
                            {credit.status === "pending" && (
                              <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                                PENDIENTE
                              </span>
                            )}
                            {credit.status === "paid" && (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                                PAGADO
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <p><span className="font-medium">Cliente:</span> {credit.customer?.name || "Sin cliente"}</p>
                            <p><span className="font-medium">Producto:</span> {credit.product?.name}</p>
                            <p><span className="font-medium">Bodega:</span> {credit.warehouse?.name}</p>
                            <p><span className="font-medium">Monto:</span> ${credit.creditAmount.toLocaleString("es-CO")}</p>
                            {credit.creditDueDate && (
                              <p>
                                <span className="font-medium">Vence:</span> {formatColombiaDate(credit.creditDueDate)}
                                {credit.daysOverdue > 0 && (
                                  <span className="text-red-600 font-semibold ml-2">
                                    ({credit.daysOverdue} días vencido)
                                  </span>
                                )}
                              </p>
                            )}
                            {credit.creditPaidDate && (
                              <p>
                                <span className="font-medium">Pagado:</span> {formatColombiaDate(credit.creditPaidDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        {!credit.creditPaid && (
                          <Button
                            onClick={() => handleMarkAsPaid(credit.id)}
                            size="sm"
                            className="ml-4"
                          >
                            Marcar como Pagado
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botón de atrás al final */}
        <div className="mt-8 flex justify-center">
          <BackButton href="/dashboard" />
        </div>
      </div>
    </div>
  )
}


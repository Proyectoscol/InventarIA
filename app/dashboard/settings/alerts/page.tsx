"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { BackButton } from "@/components/shared/BackButton"
import { Bell, Package, DollarSign } from "lucide-react"
import { toast } from "sonner"

export default function AlertsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [alertConfig, setAlertConfig] = useState<{
    enableStockAlerts: boolean
    enableCreditAlerts: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      fetchAlertConfig(selectedCompanyId)
    }
  }, [selectedCompanyId])

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
    }
  }

  const fetchAlertConfig = async (companyId: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/companies/${companyId}/alerts`)
      if (res.ok) {
        const data = await res.json()
        setAlertConfig({
          enableStockAlerts: data.enableStockAlerts !== false,
          enableCreditAlerts: data.enableCreditAlerts !== false
        })
      }
    } catch (error) {
      console.error("Error cargando configuración de alertas:", error)
      toast.error("Error al cargar configuración de alertas")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedCompanyId || !alertConfig) return

    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}/alerts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enableStockAlerts: alertConfig.enableStockAlerts,
          enableCreditAlerts: alertConfig.enableCreditAlerts
        })
      })

      if (res.ok) {
        toast.success("✅ Configuración guardada exitosamente", {
          description: "Los cambios en las alertas se han guardado correctamente",
          duration: 3000
        })
      } else {
        const error = await res.json()
        throw new Error(error.error || "Error al guardar configuración")
      }
    } catch (error: any) {
      toast.error("❌ Error al guardar configuración", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="p-8">Cargando...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton href="/dashboard/settings" />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuración de Alertas</h1>
          <p className="text-muted-foreground">
            Activa o desactiva los tipos de alertas que deseas recibir
          </p>
        </div>

        {/* Selector de Compañía */}
        {companies.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Seleccionar Compañía</CardTitle>
            </CardHeader>
            <CardContent>
              <select
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
            </CardContent>
          </Card>
        )}

        {/* Configuración de Tipos de Alertas */}
        {alertConfig && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <CardTitle>Tipos de Alertas</CardTitle>
              </div>
              <CardDescription>
                Activa o desactiva los tipos de alertas que deseas recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Alertas de Stock Bajo */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <Package className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <Label htmlFor="stock-alerts" className="text-base font-semibold cursor-pointer">
                      Alertas de Stock Bajo
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recibe notificaciones cuando el stock de un producto está por debajo del umbral mínimo configurado
                    </p>
                  </div>
                </div>
                <Switch
                  id="stock-alerts"
                  checked={alertConfig.enableStockAlerts}
                  onCheckedChange={(checked) => {
                    setAlertConfig({
                      ...alertConfig,
                      enableStockAlerts: checked
                    })
                  }}
                />
              </div>

              {/* Alertas de Créditos Vencidos */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <Label htmlFor="credit-alerts" className="text-base font-semibold cursor-pointer">
                      Alertas de Créditos Vencidos
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recibe notificaciones cuando hay créditos que vencen hoy o están vencidos
                    </p>
                  </div>
                </div>
                <Switch
                  id="credit-alerts"
                  checked={alertConfig.enableCreditAlerts}
                  onCheckedChange={(checked) => {
                    setAlertConfig({
                      ...alertConfig,
                      enableCreditAlerts: checked
                    })
                  }}
                />
              </div>

              {/* Botón de Guardar */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información sobre Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Las alertas se envían automáticamente a todos los usuarios asociados a la compañía. 
              Para agregar o quitar destinatarios, gestiona los usuarios de la compañía.
            </p>
          </CardContent>
        </Card>

        {/* Botón de atrás al final */}
        <div className="mt-8 flex justify-center">
          <BackButton href="/dashboard/settings" />
        </div>
      </div>
    </div>
  )
}

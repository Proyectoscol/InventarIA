"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  ShoppingCart, 
  Package, 
  TrendingUp,
  Building2,
  Warehouse,
  ArrowRight,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/companies")
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
        
        // Si hay compañías, obtener bodegas de la primera
        if (data.length > 0) {
          const warehousesRes = await fetch(`/api/companies/${data[0].id}/warehouses`)
          if (warehousesRes.ok) {
            const warehousesData = await warehousesRes.json()
            // Obtener todas las bodegas de todas las compañías
            const allWarehouses = []
            for (const company of data) {
              const wRes = await fetch(`/api/companies/${company.id}/warehouses`)
              if (wRes.ok) {
                const wData = await wRes.json()
                allWarehouses.push(...wData)
              }
            }
            setWarehouses(allWarehouses)
          }
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <div className="p-8">Cargando...</div>
  }

  if (!session) {
    return null
  }

  const hasCompanies = companies.length > 0
  const hasWarehouses = warehouses.length > 0
  const canUseSystem = hasCompanies && hasWarehouses

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Bienvenido, {session.user?.name}
        </h1>
        <p className="text-muted-foreground mb-8">
          Gestiona tu inventario de manera eficiente
        </p>

        {/* Flujo de configuración inicial */}
        {!canUseSystem && (
          <div className="mb-8">
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle>Configuración Inicial</CardTitle>
                <CardDescription>
                  Completa estos pasos para comenzar a usar el sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Paso 1: Crear Compañía */}
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  hasCompanies ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      hasCompanies ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                    }`}>
                      {hasCompanies ? <CheckCircle className="h-6 w-6" /> : "1"}
                    </div>
                    <div>
                      <h3 className="font-semibold">Crear Compañía</h3>
                      <p className="text-sm text-muted-foreground">
                        {hasCompanies 
                          ? `${companies.length} compañía(s) creada(s)`
                          : "Necesitas crear al menos una compañía para comenzar"
                        }
                      </p>
                    </div>
                  </div>
                  {!hasCompanies && (
                    <Link href="/dashboard/settings/companies">
                      <Button>
                        Crear Compañía
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Paso 2: Crear Bodega */}
                {hasCompanies && (
                  <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    hasWarehouses ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        hasWarehouses ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                      }`}>
                        {hasWarehouses ? <CheckCircle className="h-6 w-6" /> : "2"}
                      </div>
                      <div>
                        <h3 className="font-semibold">Crear Bodega</h3>
                        <p className="text-sm text-muted-foreground">
                          {hasWarehouses 
                            ? `${warehouses.length} bodega(s) creada(s)`
                            : "Necesitas crear al menos una bodega para gestionar inventario"
                          }
                        </p>
                      </div>
                    </div>
                    {!hasWarehouses && (
                      <Link href="/dashboard/settings/warehouses">
                        <Button>
                          Crear Bodega
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Secciones rápidas - Solo se muestran si hay compañías y bodegas */}
        {canUseSystem && (
          <>
            {/* Acciones Rápidas */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/movements/sale">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <ShoppingCart className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle>Nueva Venta</CardTitle>
                          <CardDescription>
                            Registra una nueva venta
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/dashboard/movements/purchase">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle>Nueva Compra</CardTitle>
                          <CardDescription>
                            Registra una nueva compra
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Inventario y Reportes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/dashboard/inventory">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Package className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle>Inventario</CardTitle>
                        <CardDescription>
                          Gestiona tus productos y stock
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/dashboard/stats">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle>Reportes y Estadísticas</CardTitle>
                        <CardDescription>
                          Visualiza tus ventas, ganancias y análisis
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

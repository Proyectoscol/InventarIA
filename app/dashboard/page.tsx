"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])

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

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies")
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("Error cargando compañías:", error)
    }
  }

  if (status === "loading") {
    return <div className="p-8">Cargando...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">
          Bienvenido, {session.user?.name}
        </h1>

        {/* Resumen rápido */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compañías</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{companies.length}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Compañías registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/movements/sale" className="block">
                <Button className="w-full" size="sm">🛒 Nueva Venta</Button>
              </Link>
              <Link href="/dashboard/movements/purchase" className="block">
                <Button variant="outline" className="w-full" size="sm">📦 Nueva Compra</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/inventory">
                <Button variant="outline" className="w-full" size="sm">
                  📋 Ver Inventario
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reportes</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/stats">
                <Button variant="outline" className="w-full" size="sm">
                  📊 Ver Estadísticas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {companies.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Primeros Pasos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Para comenzar, necesitas crear una compañía.
              </p>
              <Link href="/dashboard/settings/companies">
                <Button>Crear Compañía</Button>
              </Link>
            </CardContent>
          </Card>
        )}
    </div>
  )
}


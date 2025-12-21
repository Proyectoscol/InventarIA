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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Bienvenido, {session.user?.name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Compañías</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{companies.length}</p>
              <p className="text-sm text-muted-foreground">
                Compañías registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/movements/sale" className="block">
                <Button className="w-full">Nueva Venta</Button>
              </Link>
              <Link href="/dashboard/movements/purchase" className="block">
                <Button variant="outline" className="w-full">Nueva Compra</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navegación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/inventory" className="block">
                <Button variant="outline" className="w-full">Inventario</Button>
              </Link>
              <Link href="/dashboard/stats" className="block">
                <Button variant="outline" className="w-full">Estadísticas</Button>
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
    </div>
  )
}


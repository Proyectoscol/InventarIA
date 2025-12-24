"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BackButton } from "@/components/shared/BackButton"
import { toast } from "sonner"

export default function CompaniesSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCompanyName, setNewCompanyName] = useState("")

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
    } finally {
      setLoading(false)
    }
  }

  const createCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCompanyName.trim()) return

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim() })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("✅ Compañía creada exitosamente", {
          description: "Redirigiendo a crear bodega...",
          duration: 2000
        })
        setNewCompanyName("")
        // Redirigir a crear bodega después de crear la compañía
        setTimeout(() => {
          router.push("/dashboard/settings/warehouses")
        }, 1000)
      } else {
        console.error("Error del servidor:", data)
        toast.error("❌ Error al crear compañía", {
          description: data.error || "Por favor, intenta nuevamente",
          duration: 4000
        })
      }
    } catch (error: any) {
      console.error("Error creando compañía:", error)
      toast.error("❌ Error al crear compañía", {
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

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <BackButton href="/dashboard/settings" />
        </div>
        <h1 className="text-3xl font-bold mb-6">Configuración de Compañías</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Crear Nueva Compañía</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCompany} className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nombre de la Compañía</Label>
                <Input
                  id="companyName"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Mi Empresa S.A."
                  required
                />
              </div>
              <Button type="submit">Crear Compañía</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Compañías ({companies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No tienes compañías registradas.
                </p>
                <p className="text-sm text-muted-foreground">
                  Crea tu primera compañía usando el formulario de arriba.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companies.map((company) => (
                  <Card key={company.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{company.name}</h3>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>
                              📦 {company._count?.products || 0} productos
                            </span>
                            <span>
                              🏢 {company._count?.warehouses || 0} bodegas
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
        body: JSON.stringify({ name: newCompanyName })
      })

      if (res.ok) {
        setNewCompanyName("")
        fetchCompanies()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || "No se pudo crear la compañía"}`)
      }
    } catch (error) {
      console.error("Error creando compañía:", error)
      alert("Error al crear la compañía")
    }
  }

  if (status === "loading" || loading) {
    return <div className="p-8">Cargando...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
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
              <p className="text-muted-foreground">
                No tienes compañías. Crea una para comenzar.
              </p>
            ) : (
              <div className="space-y-4">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="p-4 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {company._count?.products || 0} productos •{" "}
                        {company._count?.warehouses || 0} bodegas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


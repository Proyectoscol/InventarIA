"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { BackButton } from "@/components/shared/BackButton"
import { toast } from "sonner"

export default function WarehousesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newWarehouseName, setNewWarehouseName] = useState("")
  const [newWarehouseDescription, setNewWarehouseDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

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
      fetchWarehouses(selectedCompanyId)
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
    } finally {
      setLoading(false)
    }
  }

  const fetchWarehouses = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/warehouses`)
      if (res.ok) {
        const data = await res.json()
        setWarehouses(data)
      }
    } catch (error) {
      console.error("Error cargando bodegas:", error)
    }
  }

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWarehouseName.trim() || !selectedCompanyId) return

    setIsCreating(true)
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}/warehouses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWarehouseName.trim(),
          description: newWarehouseDescription.trim() || undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("✅ Bodega creada exitosamente", {
          description: "La bodega se ha agregado correctamente",
          duration: 3000
        })
        setNewWarehouseName("")
        setNewWarehouseDescription("")
        fetchWarehouses(selectedCompanyId)
      } else {
        toast.error("❌ Error al crear bodega", {
          description: data.error || "Por favor, intenta nuevamente",
          duration: 4000
        })
      }
    } catch (error: any) {
      console.error("Error creando bodega:", error)
      toast.error("❌ Error al crear bodega", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setIsCreating(false)
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
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Bodegas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Primero necesitas crear una compañía para poder gestionar bodegas.
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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <BackButton href="/dashboard" />
        </div>
        <h1 className="text-3xl font-bold mb-6">Gestión de Bodegas</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seleccionar Compañía</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="company">Compañía</Label>
              <select
                id="company"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full p-2 border rounded-md"
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Crear Nueva Bodega</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createWarehouse} className="space-y-4">
              <div>
                <Label htmlFor="warehouseName">Nombre de la Bodega</Label>
                <Input
                  id="warehouseName"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  placeholder="Bodega Principal"
                  required
                />
              </div>
              <div>
                <Label htmlFor="warehouseDescription">Descripción (opcional)</Label>
                <Input
                  id="warehouseDescription"
                  value={newWarehouseDescription}
                  onChange={(e) => setNewWarehouseDescription(e.target.value)}
                  placeholder="Descripción de la bodega"
                />
              </div>
              <Button type="submit" disabled={isCreating || !selectedCompanyId}>
                {isCreating ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creando...
                  </>
                ) : (
                  "✅ Crear Bodega"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Bodegas de {companies.find(c => c.id === selectedCompanyId)?.name || "Compañía"} ({warehouses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warehouses.length === 0 ? (
              <p className="text-muted-foreground">
                No hay bodegas. Crea una para comenzar.
              </p>
            ) : (
              <div className="space-y-4">
                {warehouses.map((warehouse) => (
                  <div
                    key={warehouse.id}
                    className="p-4 border rounded-lg"
                  >
                    <h3 className="font-semibold">{warehouse.name}</h3>
                    {warehouse.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {warehouse.description}
                      </p>
                    )}
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


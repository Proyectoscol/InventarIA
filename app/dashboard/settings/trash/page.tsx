"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/shared/BackButton"
import { toast } from "sonner"
import { Trash2, RotateCcw, Package } from "lucide-react"

export default function TrashPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [deletedProducts, setDeletedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      fetchDeletedProducts()
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

  const fetchDeletedProducts = async () => {
    if (!selectedCompanyId) return
    
    try {
      const res = await fetch(`/api/products/trash?companyId=${selectedCompanyId}`)
      if (res.ok) {
        const data = await res.json()
        setDeletedProducts(data)
      }
    } catch (error) {
      console.error("Error cargando productos eliminados:", error)
      toast.error("Error al cargar productos eliminados")
    }
  }

  const handleRestore = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/restore`, {
        method: "POST"
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al restaurar producto")
      }

      toast.success("✅ Producto restaurado exitosamente", {
        description: "El producto ha sido restaurado y está disponible nuevamente",
        duration: 3000
      })

      fetchDeletedProducts()
    } catch (error: any) {
      toast.error("❌ Error al restaurar producto", {
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
        <div className="mb-4">
          <BackButton href="/dashboard/settings" />
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Primero necesitas crear una compañía.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <BackButton href="/dashboard/settings" />
        </div>
        <h1 className="text-3xl font-bold mb-6">Papelera</h1>

        {/* Selector de Compañía */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seleccionar Compañía</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">Compañía</label>
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

        {/* Lista de Productos Eliminados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Productos Eliminados ({deletedProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deletedProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay productos eliminados en esta compañía.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deletedProducts.map((product) => (
                  <Card key={product.id} className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <Trash2 className="h-5 w-5 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      {product.imageBase64 && (
                        <img
                          src={product.imageBase64}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      )}

                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          <strong>Movimientos:</strong> {product._count?.movements || 0}
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Eliminado:</strong> {new Date(product.deletedAt).toLocaleDateString("es-CO")}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleRestore(product.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar Producto
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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


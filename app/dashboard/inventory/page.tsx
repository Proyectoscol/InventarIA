"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductForm } from "@/components/forms/ProductForm"

export default function InventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [companyId, setCompanyId] = useState<string>("")
  const [showAddProduct, setShowAddProduct] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch("/api/companies")
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            setCompanyId(data[0].id)
            fetchProducts(data[0].id)
          }
        })
    }
  }, [session])

  const fetchProducts = async (compId: string) => {
    try {
      const res = await fetch(`/api/companies/${compId}/products?q=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error cargando productos:", error)
    }
  }

  if (status === "loading") {
    return <div className="p-8">Cargando...</div>
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inventario</h1>
          {companyId && (
            <Button onClick={() => setShowAddProduct(true)}>+ Agregar Producto</Button>
          )}
        </div>

        {showAddProduct && companyId && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Agregar Nuevo Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductForm
                companyId={companyId}
                onSuccess={() => {
                  setShowAddProduct(false)
                  if (companyId) {
                    fetchProducts(companyId)
                  }
                }}
                onCancel={() => setShowAddProduct(false)}
              />
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              if (companyId) {
                fetchProducts(companyId)
              }
            }}
            className="max-w-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {product.imageBase64 && (
                  <img
                    src={product.imageBase64}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  {product.description || "Sin descripción"}
                </p>
                <p className="text-sm">
                  Umbral mínimo: {product.minStockThreshold} unidades
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No hay productos registrados. Crea tu primer producto para comenzar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductForm } from "@/components/forms/ProductForm"
import { BackButton } from "@/components/shared/BackButton"

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
    <div className="p-8">
        <div className="mb-4">
          <BackButton href="/dashboard" />
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inventario</h1>
          {companyId && !showAddProduct && (
            <Button onClick={() => setShowAddProduct(true)}>+ Agregar Producto</Button>
          )}
        </div>

        {showAddProduct && companyId && (
          <Card className="mb-6 border-2 border-primary">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Agregar Nuevo Producto</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddProduct(false)}
                >
                  ✕ Cerrar
                </Button>
              </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const totalStock = product.stock?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0
            const isLowStock = totalStock < product.minStockThreshold
            
            return (
              <Card key={product.id} className={`hover:shadow-lg transition-shadow ${isLowStock ? 'border-red-300 bg-red-50' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.imageBase64 && (
                    <img
                      src={product.imageBase64}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {product.description || "Sin descripción"}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Stock Total:</span>
                      <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                        {totalStock} unidades
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Umbral mínimo:</span>
                      <span className="text-sm">{product.minStockThreshold} unidades</span>
                    </div>
                    {isLowStock && (
                      <p className="text-xs text-red-600 font-semibold mt-2">
                        ⚠️ Stock bajo
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
  )
}


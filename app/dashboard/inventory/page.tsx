"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ProductForm } from "@/components/forms/ProductForm"
import { BackButton } from "@/components/shared/BackButton"
import { EditProductModal } from "@/components/modals/EditProductModal"
import { EditThresholdModal } from "@/components/modals/EditThresholdModal"
import { ConfirmDialog } from "@/components/modals/ConfirmDialog"
import { Edit, Package, Calendar, DollarSign, ShoppingCart, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function InventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [companyId, setCompanyId] = useState<string>("")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [productDetails, setProductDetails] = useState<Record<string, any>>({})
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [editingThreshold, setEditingThreshold] = useState<any>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
            setCompanies(data)
            setCompanyId(data[0].id)
            fetchWarehouses(data[0].id)
          }
        })
    }
  }, [session])

  useEffect(() => {
    if (companyId && selectedWarehouseId) {
      fetchProducts(companyId, selectedWarehouseId)
    }
  }, [companyId, selectedWarehouseId, search])

  const fetchWarehouses = async (compId: string) => {
    try {
      const res = await fetch(`/api/companies/${compId}/warehouses`)
      if (res.ok) {
        const data = await res.json()
        setWarehouses(data)
        if (data.length > 0 && !selectedWarehouseId) {
          setSelectedWarehouseId(data[0].id)
        }
      }
    } catch (error) {
      console.error("Error cargando bodegas:", error)
    }
  }

  const fetchProducts = async (compId: string, warehouseId: string) => {
    try {
      const res = await fetch(`/api/companies/${compId}/products?q=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        // Mostrar todos los productos de la compañía, no solo los que tienen stock
        // El stock se mostrará como 0 si no existe registro para esa bodega
        const filteredProducts = data
        
        // Enriquecer con información de movimientos para el modal de confirmación
        const enrichedProducts = await Promise.all(
          filteredProducts.map(async (product: any) => {
            try {
              const productRes = await fetch(`/api/products/${product.id}`)
              if (productRes.ok) {
                const productData = await productRes.json()
                return {
                  ...product,
                  _count: productData._count || { movements: 0 },
                  movements: productData.movements || []
                }
              }
              return product
            } catch {
              return product
            }
          })
        )
        
        setProducts(enrichedProducts)
        
        // Cargar detalles de último pedido para cada producto
        enrichedProducts.forEach((product: any) => {
          fetchProductDetails(product.id, warehouseId)
        })
      }
    } catch (error) {
      console.error("Error cargando productos:", error)
    }
  }

  const fetchProductDetails = async (productId: string, warehouseId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/last-purchase?warehouseId=${warehouseId}`)
      if (res.ok) {
        const data = await res.json()
        setProductDetails(prev => ({
          ...prev,
          [productId]: data
        }))
      }
    } catch (error) {
      console.error("Error cargando detalles del producto:", error)
    }
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
  }

  const handleEditThreshold = (product: any) => {
    setEditingThreshold(product)
  }

  const handleAddStock = (product: any) => {
    // Redirigir a página de compra con producto y bodega pre-seleccionados
    router.push(`/dashboard/movements/purchase?productId=${product.id}&warehouseId=${selectedWarehouseId}`)
  }

  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE"
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar producto")
      }

      const result = await res.json()
      
      toast.success(result.softDelete 
        ? "✅ Producto movido a la papelera" 
        : "✅ Producto eliminado completamente", {
        description: result.message,
        duration: 3000
      })

      // Cerrar modal y limpiar estado
      setDeleteConfirmOpen(false)
      setProductToDelete(null)

      // Refrescar lista de productos
      if (companyId && selectedWarehouseId) {
        fetchProducts(companyId, selectedWarehouseId)
      }
    } catch (error: any) {
      toast.error("❌ Error al eliminar producto", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === "loading") {
    return <div className="p-8">Cargando...</div>
  }

  if (!companyId || warehouses.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-4">
          <BackButton href="/dashboard" />
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Primero necesitas crear una compañía y una bodega para ver el inventario.
            </p>
          </CardContent>
        </Card>
      </div>
    )
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

      {/* Selector de Bodega */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Bodega</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="warehouse">Bodega</Label>
            <Select
              id="warehouse"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
            >
              <option value="">Seleccionar bodega...</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </Select>
            {!selectedWarehouseId && (
              <p className="text-sm text-muted-foreground mt-2">
                Selecciona una bodega para ver el inventario
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
                if (companyId && selectedWarehouseId) {
                  fetchProducts(companyId, selectedWarehouseId)
                }
              }}
              onCancel={() => setShowAddProduct(false)}
            />
          </CardContent>
        </Card>
      )}

      {selectedWarehouseId && (
        <>
          <div className="mb-6">
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => {
              const stock = product.stock?.find((s: any) => s.warehouseId === selectedWarehouseId)
              const stockQuantity = stock?.quantity ?? 0 // Usar ?? para que 0 se muestre correctamente
              const isLowStock = stockQuantity < product.minStockThreshold
              const details = productDetails[product.id] || {}
              
              return (
                <Card key={product.id} className={`hover:shadow-lg transition-shadow ${isLowStock ? 'border-red-300 bg-red-50' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex-1">{product.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {product.imageBase64 && (
                      <img
                        src={product.imageBase64}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    )}
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description || "Sin descripción"}
                    </p>
                    
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Stock:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                            {stockQuantity} unidades
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddStock(product)}
                            className="h-6 px-2 text-xs"
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Umbral mínimo:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{product.minStockThreshold} unidades</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditThreshold(product)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {details.lastPurchase && (
                        <>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Último pedido:
                            </span>
                            <span className="text-xs">
                              {new Date(details.lastPurchaseDate).toLocaleDateString("es-CO")}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Precio último pedido:
                            </span>
                            <span className="text-sm font-semibold">
                              ${details.lastPurchasePrice?.toLocaleString("es-CO")} COP
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Costo de adquisición:</span>
                            <span className="text-sm font-semibold text-blue-600">
                              ${details.lastPurchasePrice?.toLocaleString("es-CO")} COP/unidad
                            </span>
                          </div>
                        </>
                      )}

                      {isLowStock && (
                        <p className="text-xs text-red-600 font-semibold mt-2 pt-2 border-t">
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
                  No hay productos con stock en esta bodega.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modales de edición */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          companyId={companyId}
          open={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            if (companyId && selectedWarehouseId) {
              fetchProducts(companyId, selectedWarehouseId)
            }
          }}
        />
      )}

      {editingThreshold && (
        <EditThresholdModal
          productId={editingThreshold.id}
          productName={editingThreshold.name}
          currentThreshold={editingThreshold.minStockThreshold}
          open={!!editingThreshold}
          onClose={() => setEditingThreshold(null)}
          onSuccess={() => {
            if (companyId && selectedWarehouseId) {
              fetchProducts(companyId, selectedWarehouseId)
            }
          }}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {productToDelete && (() => {
        const hasMovements = productToDelete._count?.movements > 0 || productToDelete.movements?.length > 0
        return (
          <ConfirmDialog
            open={deleteConfirmOpen}
            onClose={() => {
              setDeleteConfirmOpen(false)
              setProductToDelete(null)
            }}
            onConfirm={confirmDeleteProduct}
            title={`Eliminar Producto: ${productToDelete.name}`}
            description={
              hasMovements
                ? `Este producto tiene ${productToDelete._count?.movements || productToDelete.movements?.length || 0} movimiento(s) histórico(s) (compras o ventas). Será movido a la papelera y podrás restaurarlo más tarde desde Configuración > Papelera. Los movimientos históricos se mantendrán intactos.`
                : `Este producto no tiene movimientos históricos. Será eliminado completamente y no podrás restaurarlo. Esta acción no se puede deshacer.`
            }
            type={hasMovements ? "soft-delete" : "hard-delete"}
            loading={isDeleting}
          />
        )
      })()}
    </div>
  )
}

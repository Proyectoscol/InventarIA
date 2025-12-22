"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PurchaseForm } from "@/components/forms/PurchaseForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/shared/BackButton"

export default function PurchasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<string>("")
  const [preselectedProductId, setPreselectedProductId] = useState<string>("")
  const [preselectedWarehouseId, setPreselectedWarehouseId] = useState<string>("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const productId = params.get("productId")
      const warehouseId = params.get("warehouseId")
      
      if (productId) setPreselectedProductId(productId)
      if (warehouseId) setPreselectedWarehouseId(warehouseId)
    }
  }, [])

  useEffect(() => {
    if (session) {
      // Por ahora, obtener la primera compañía del usuario
      // En producción, esto debería venir de un selector de compañía
      fetch("/api/companies")
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            const firstCompany = data[0]
            setCompanyId(firstCompany.id)
            fetchWarehouses(firstCompany.id)
          }
        })
    }
  }, [session])

  const fetchWarehouses = async (compId: string) => {
    try {
      const res = await fetch(`/api/companies/${compId}/warehouses`)
      if (res.ok) {
        const data = await res.json()
        setWarehouses(data)
      }
    } catch (error) {
      console.error("Error cargando bodegas:", error)
    }
  }

  if (status === "loading" || !companyId) {
    return <div className="p-8">Cargando...</div>
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton href="/dashboard" />
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Nueva Compra</h1>
          <p className="text-muted-foreground mt-1">
            Registra una nueva compra de productos para tu inventario
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <PurchaseForm
              companyId={companyId}
              warehouses={warehouses}
              preselectedProductId={preselectedProductId}
              preselectedWarehouseId={preselectedWarehouseId}
              onSuccess={() => router.push("/dashboard/inventory")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


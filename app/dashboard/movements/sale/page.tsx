"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SaleForm } from "@/components/forms/SaleForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/shared/BackButton"

export default function SalePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<string>("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

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
            fetchCustomers(firstCompany.id)
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

  const fetchCustomers = async (compId: string) => {
    try {
      const res = await fetch(`/api/companies/${compId}/customers`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Error cargando clientes:", error)
    }
  }

  if (status === "loading" || !companyId) {
    return <div className="p-8">Cargando...</div>
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <BackButton href="/dashboard" />
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Nueva Venta</h1>
          <p className="text-muted-foreground mt-1">
            Registra una nueva venta de productos de tu inventario
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <SaleForm
              companyId={companyId}
              warehouses={warehouses}
              customers={customers}
              onSuccess={() => router.push("/dashboard")}
              onCustomerCreated={(newCustomer) => {
                setCustomers([...customers, newCustomer])
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


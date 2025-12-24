"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/shared/BackButton"
import { CustomerForm } from "@/components/forms/CustomerForm"
import { CustomerDetailsModal } from "@/components/modals/CustomerDetailsModal"
import { toast } from "sonner"
import { User, DollarSign } from "lucide-react"
import Link from "next/link"

export default function CustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

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
      fetchCustomers(selectedCompanyId)
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

  const fetchCustomers = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/customers`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Error cargando clientes:", error)
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <BackButton href="/dashboard" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Primero necesitas crear una compañía para poder gestionar clientes.
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
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <BackButton href="/dashboard/settings" />
        </div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Administra los clientes de tu compañía
            </p>
          </div>
          {selectedCompanyId && (
            <div className="flex gap-2">
              <Link href="/dashboard/credits">
                <Button variant="outline" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Créditos
                </Button>
              </Link>
              <Button onClick={() => setShowCreateCustomer(true)}>
                + Crear Cliente
              </Button>
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seleccionar Compañía</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Compañía
              </label>
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

        {showCreateCustomer && selectedCompanyId && (
          <Card className="mb-6 border-2 border-primary">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Crear Nuevo Cliente</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateCustomer(false)}
                >
                  ✕ Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CustomerForm
                companyId={selectedCompanyId}
                onSuccess={(newCustomer) => {
                  if (newCustomer) {
                    setCustomers([...customers, newCustomer])
                    setShowCreateCustomer(false)
                    toast.success("✅ Cliente creado exitosamente", {
                      description: "El cliente se ha agregado correctamente",
                      duration: 3000
                    })
                  }
                }}
                onCancel={() => setShowCreateCustomer(false)}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Clientes de {companies.find(c => c.id === selectedCompanyId)?.name || "Compañía"} ({customers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No hay clientes registrados.
                </p>
                <p className="text-sm text-muted-foreground">
                  Crea tu primer cliente usando el botón "Crear Cliente".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customers.map((customer) => (
                  <Card 
                    key={customer.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{customer.name}</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {customer.phone && (
                              <p>📞 {customer.phone}</p>
                            )}
                            {customer.address && (
                              <p>📍 {customer.address}</p>
                            )}
                          </div>
                        </div>
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de detalles del cliente */}
        {selectedCustomer && selectedCompanyId && (
          <CustomerDetailsModal
            customer={selectedCustomer}
            companyId={selectedCompanyId}
            onClose={() => setSelectedCustomer(null)}
          />
        )}

        {/* Botón de atrás al final */}
        <div className="mt-8 flex justify-center">
          <BackButton href="/dashboard/settings" />
        </div>
      </div>
    </div>
  )
}


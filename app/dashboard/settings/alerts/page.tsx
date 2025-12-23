"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/shared/BackButton"
import { Bell, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AlertsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [userEmails, setUserEmails] = useState<string[]>([])
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    email?: string
    messageId?: string
    error?: string
  } | null>(null)

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
      fetchUserEmails(selectedCompanyId)
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
    }
  }

  const fetchUserEmails = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/users/emails`)
      if (res.ok) {
        const data = await res.json()
        setUserEmails(data.emails || [])
      }
    } catch (error) {
      console.error("Error cargando emails de usuarios:", error)
      setUserEmails([])
    }
  }

  const handleTestEmail = async (email: string) => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch("/api/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          email: email,
          messageId: data.messageId
        })
        toast.success("✅ Email de prueba enviado exitosamente", {
          description: `El email se envió correctamente a ${email}`,
          duration: 5000
        })
      } else {
        setTestResult({
          success: false,
          email: email,
          error: data.error || "Error desconocido"
        })
        toast.error("❌ Error al enviar email de prueba", {
          description: data.error || "Por favor, verifica la configuración",
          duration: 5000
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        email: email,
        error: error.message || "Error de conexión"
      })
      toast.error("❌ Error al enviar email de prueba", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 5000
      })
    } finally {
      setTesting(false)
    }
  }

  if (status === "loading") {
    return <div className="p-8">Cargando...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton href="/dashboard/settings" />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuración de Alertas</h1>
          <p className="text-muted-foreground">
            Las alertas se envían automáticamente a los usuarios asociados a cada compañía
          </p>
        </div>

        {/* Selector de Compañía */}
        {companies.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Seleccionar Compañía</CardTitle>
            </CardHeader>
            <CardContent>
              <select
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
            </CardContent>
          </Card>
        )}

        {/* Información de Alertas */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <CardTitle>Destinatarios de Alertas</CardTitle>
            </div>
            <CardDescription>
              Los siguientes usuarios recibirán alertas de stock bajo y créditos vencidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userEmails.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  No hay usuarios con email asociados a esta compañía
                </p>
                <p className="text-sm text-muted-foreground">
                  Las alertas se enviarán a los emails de los usuarios que estén asociados a la compañía
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userEmails.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">{email}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestEmail(email)}
                      disabled={testing}
                    >
                      {testing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Probar
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultado de Prueba */}
        {testResult && (
          <Card className={`mb-6 ${testResult.success ? "border-green-500" : "border-red-500"}`}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <CardTitle>
                  {testResult.success ? "Prueba Exitosa" : "Error en la Prueba"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Email:</strong> {testResult.email}
                </p>
                {testResult.success ? (
                  <>
                    <p className="text-green-600">
                      ✅ El email se envió correctamente
                    </p>
                    {testResult.messageId && (
                      <p className="text-sm text-muted-foreground">
                        ID del mensaje: {testResult.messageId}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-red-600">
                    ❌ Error: {testResult.error}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información sobre Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🔴 Alertas de Stock Bajo</h3>
              <p className="text-sm text-muted-foreground">
                Se envían automáticamente cuando el stock de un producto está por debajo del umbral mínimo configurado.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⏰ Alertas de Créditos Vencidos</h3>
              <p className="text-sm text-muted-foreground">
                Se envían automáticamente cuando hay créditos que vencen hoy o están vencidos.
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Las alertas se envían a todos los usuarios asociados a la compañía. 
                Para agregar o quitar destinatarios, gestiona los usuarios de la compañía.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


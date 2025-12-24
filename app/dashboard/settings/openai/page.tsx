"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BackButton } from "@/components/shared/BackButton"
import { Bot, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function OpenAIPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [openaiKey, setOpenaiKey] = useState<string>("")
  const [showKey, setShowKey] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configStatus, setConfigStatus] = useState<{
    configured: boolean
    lastChars: string | null
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
      fetchApiConfig(selectedCompanyId)
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

  const fetchApiConfig = async (companyId: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/companies/${companyId}/api-config`)
      if (res.ok) {
        const data = await res.json()
        setConfigStatus(data)
        // No pre-llenar el campo de API Key por seguridad
        setOpenaiKey("")
      }
    } catch (error) {
      console.error("Error cargando configuración de API:", error)
      toast.error("Error al cargar configuración de API")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedCompanyId) return

    if (!openaiKey.trim()) {
      toast.error("Por favor, ingresa una API Key de OpenAI")
      return
    }

    // Validar formato básico de API Key de OpenAI (empieza con sk-)
    if (!openaiKey.trim().startsWith("sk-")) {
      toast.error("La API Key de OpenAI debe comenzar con 'sk-'")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}/api-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiKey: openaiKey.trim()
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("✅ API Key guardada exitosamente", {
          description: `Últimos 10 caracteres: ...${data.lastChars}`,
          duration: 4000
        })
        setOpenaiKey("") // Limpiar el campo por seguridad
        await fetchApiConfig(selectedCompanyId) // Recargar estado
      } else {
        throw new Error(data.error || "Error al guardar API Key")
      }
    } catch (error: any) {
      toast.error("❌ Error al guardar API Key", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCompanyId) return

    if (!confirm("¿Estás seguro de que deseas eliminar la API Key de OpenAI?")) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}/api-config`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast.success("✅ API Key eliminada exitosamente", {
          duration: 3000
        })
        setOpenaiKey("")
        await fetchApiConfig(selectedCompanyId)
      } else {
        const data = await res.json()
        throw new Error(data.error || "Error al eliminar API Key")
      }
    } catch (error: any) {
      toast.error("❌ Error al eliminar API Key", {
        description: error.message || "Por favor, intenta nuevamente",
        duration: 4000
      })
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
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
          <h1 className="text-3xl font-bold mb-2">Configuración de OpenAI</h1>
          <p className="text-muted-foreground">
            Configura tu API Key de OpenAI para habilitar funciones de inteligencia artificial
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

        {/* Estado de Configuración */}
        {configStatus && (
          <Card className={`mb-6 ${configStatus.configured ? "border-green-500" : "border-gray-300"}`}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                {configStatus.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <CardTitle>
                  Estado de Configuración
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {configStatus.configured ? (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">
                    ✅ API Key configurada correctamente
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Últimos 10 caracteres: <code className="bg-gray-100 px-2 py-1 rounded">...{configStatus.lastChars}</code>
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">
                  ⚠️ No hay API Key configurada para esta compañía
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Formulario de Configuración */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <CardTitle>API Key de OpenAI</CardTitle>
            </div>
            <CardDescription>
              Ingresa tu API Key de OpenAI. Esta será encriptada y almacenada de forma segura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">API Key</Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showKey ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                La API Key debe comenzar con "sk-". Puedes obtenerla en{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSave}
                disabled={saving || !openaiKey.trim()}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar API Key"
                )}
              </Button>
              {configStatus?.configured && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1"
                >
                  Eliminar API Key
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información */}
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                • Tu API Key será encriptada antes de ser almacenada en la base de datos.
              </p>
              <p>
                • Solo se mostrarán los últimos 10 caracteres para confirmación.
              </p>
              <p>
                • Esta configuración es por compañía. Cada compañía puede tener su propia API Key.
              </p>
              <p>
                • La API Key se utilizará para funciones de inteligencia artificial que se implementarán próximamente.
              </p>
            </div>
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


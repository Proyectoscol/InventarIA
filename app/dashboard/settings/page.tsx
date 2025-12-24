"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/shared/BackButton"
import Link from "next/link"
import { 
  Building2, 
  Warehouse, 
  Bell,
  Trash2,
  DollarSign,
  LogOut,
  Bot,
  CheckCircle,
  XCircle,
  Settings as SettingsIcon
} from "lucide-react"
import { signOut } from "next-auth/react"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [openaiStatus, setOpenaiStatus] = useState<{
    configured: boolean
    lastChars: string | null
  } | null>(null)
  const [companies, setCompanies] = useState<any[]>([])

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
    if (companies.length > 0) {
      fetchOpenAIStatus(companies[0].id)
    }
  }, [companies])

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies")
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("Error cargando compañías:", error)
    }
  }

  const fetchOpenAIStatus = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/api-config`)
      if (res.ok) {
        const data = await res.json()
        setOpenaiStatus(data)
      }
    } catch (error) {
      console.error("Error cargando estado de OpenAI:", error)
    }
  }

  if (status === "loading") {
    return <div className="p-8">Cargando...</div>
  }

  if (!session) {
    return null
  }

  const settingsOptions = [
    {
      title: "Compañías",
      description: "Gestiona tus compañías y sus configuraciones",
      href: "/dashboard/settings/companies",
      icon: Building2,
      color: "text-blue-600"
    },
    {
      title: "Bodegas",
      description: "Administra las bodegas de tus compañías",
      href: "/dashboard/settings/warehouses",
      icon: Warehouse,
      color: "text-green-600"
    },
    {
      title: "Alertas",
      description: "Configura las alertas de email",
      href: "/dashboard/settings/alerts",
      icon: Bell,
      color: "text-orange-600"
    },
    {
      title: "Papelera",
      description: "Productos eliminados con movimientos históricos",
      href: "/dashboard/settings/trash",
      icon: Trash2,
      color: "text-red-600"
    },
    {
      title: "Créditos",
      description: "Gestiona los créditos pendientes y vencidos",
      href: "/dashboard/credits",
      icon: DollarSign,
      color: "text-yellow-600"
    },
    {
      title: "OpenAI",
      description: "Configura tu API Key de OpenAI para IA",
      href: "/dashboard/settings/openai",
      icon: Bot,
      color: "text-purple-600"
    }
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <BackButton href="/dashboard" />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-muted-foreground">
            Administra las configuraciones de tu sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsOptions.map((option) => {
            const Icon = option.icon
            const isOpenAI = option.href === "/dashboard/settings/openai"
            
            return (
              <Link 
                key={option.href} 
                href={option.href}
                onClick={() => {
                  // Guardar el referrer para créditos
                  if (option.href === "/dashboard/credits" && typeof window !== "undefined") {
                    sessionStorage.setItem("creditsReferrer", "/dashboard/settings")
                  }
                }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className={`h-6 w-6 ${option.color}`} />
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {option.title}
                            {isOpenAI && openaiStatus && (
                              openaiStatus.configured ? (
                                <CheckCircle className="h-4 w-4 text-green-600" title="Configurado" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" title="No configurado" />
                              )
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {option.description}
                          </CardDescription>
                          {isOpenAI && openaiStatus?.configured && openaiStatus.lastChars && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Últimos 10 caracteres: <code className="bg-gray-100 px-1 py-0.5 rounded">...{openaiStatus.lastChars}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Botón de salir */}
        <Card className="mt-8 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="h-5 w-5" />
              Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Cierra tu sesión de forma segura
            </p>
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>

        {/* Botón de atrás al final */}
        <div className="mt-8 flex justify-center">
          <BackButton href="/dashboard" />
        </div>
      </div>
    </div>
  )
}


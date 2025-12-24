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
  Users, 
  Bell,
  Trash2,
  DollarSign,
  LogOut,
  Settings as SettingsIcon
} from "lucide-react"
import { signOut } from "next-auth/react"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

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
      title: "Clientes",
      description: "Gestiona tu base de clientes",
      href: "/dashboard/settings/customers",
      icon: Users,
      color: "text-purple-600"
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
            return (
              <Link key={option.href} href={option.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-6 w-6 ${option.color}`} />
                      <div>
                        <CardTitle>{option.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {option.description}
                        </CardDescription>
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


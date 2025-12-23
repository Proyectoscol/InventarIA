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
  Settings as SettingsIcon
} from "lucide-react"

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
      </div>
    </div>
  )
}


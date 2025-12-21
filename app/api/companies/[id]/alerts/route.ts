import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const alertConfig = await prisma.alertConfig.findUnique({
      where: { companyId: params.id }
    })

    if (!alertConfig) {
      // Crear configuración por defecto si no existe
      const newConfig = await prisma.alertConfig.create({
        data: {
          companyId: params.id,
          alertEmails: [],
          enableAlerts: true
        }
      })
      return NextResponse.json(newConfig)
    }

    return NextResponse.json(alertConfig)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()

    const alertConfig = await prisma.alertConfig.upsert({
      where: { companyId: params.id },
      update: {
        alertEmails: data.alertEmails || [],
        enableAlerts: data.enableAlerts !== false
      },
      create: {
        companyId: params.id,
        alertEmails: data.alertEmails || [],
        enableAlerts: data.enableAlerts !== false
      }
    })

    return NextResponse.json(alertConfig)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


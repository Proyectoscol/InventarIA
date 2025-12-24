import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET: Obtener productos eliminados (papelera)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "companyId requerido" }, { status: 400 })
    }

    const products = await prisma.product.findMany({
      where: {
        companyId,
        deletedAt: { not: null } // Solo productos eliminados
      },
      include: {
        movements: {
          select: {
            id: true
          },
          take: 1
        },
        _count: {
          select: {
            movements: true
          }
        }
      },
      orderBy: {
        deletedAt: "desc"
      }
    })

    return NextResponse.json(products)
  } catch (error: any) {
    console.error("Error obteniendo productos eliminados:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


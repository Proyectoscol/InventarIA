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

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""

    if (q.length < 2) {
      return NextResponse.json([])
    }

    const products = await prisma.product.findMany({
      where: {
        companyId: params.id,
        deletedAt: null, // Solo productos activos
        nameLower: {
          contains: q.toLowerCase()
        }
      },
      take: 10,
      select: {
        id: true,
        name: true,
        nameLower: true
      }
    })

    return NextResponse.json(products)
  } catch (error: any) {
    console.error("Error buscando productos:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


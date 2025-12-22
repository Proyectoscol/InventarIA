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

    const productId = params.id

    // Buscar el último movimiento de venta para este producto
    const lastSale = await prisma.movement.findFirst({
      where: {
        productId,
        type: "sale"
      },
      orderBy: {
        movementDate: "desc"
      },
      select: {
        unitPrice: true,
        movementDate: true
      }
    })

    if (!lastSale) {
      return NextResponse.json({ lastPrice: null })
    }

    return NextResponse.json({
      lastPrice: Number(lastSale.unitPrice),
      lastSaleDate: lastSale.movementDate
    })
  } catch (error: any) {
    console.error("Error obteniendo último precio:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo último precio" },
      { status: 500 }
    )
  }
}


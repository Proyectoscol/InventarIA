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
    const warehouseId = searchParams.get("warehouseId")
    const productId = params.id

    if (!warehouseId) {
      return NextResponse.json({ error: "warehouseId requerido" }, { status: 400 })
    }

    // Buscar el último movimiento de compra para este producto en esta bodega
    const lastPurchase = await prisma.movement.findFirst({
      where: {
        productId,
        warehouseId,
        type: "purchase"
      },
      orderBy: {
        movementDate: "desc"
      },
      select: {
        unitPrice: true,
        movementDate: true,
        quantity: true,
        totalAmount: true
      }
    })

    if (!lastPurchase) {
      return NextResponse.json({ 
        lastPurchase: null,
        lastPurchasePrice: null,
        lastPurchaseDate: null,
        lastPurchaseQuantity: null
      })
    }

    return NextResponse.json({
      lastPurchase: true,
      lastPurchasePrice: Number(lastPurchase.unitPrice),
      lastPurchaseDate: lastPurchase.movementDate,
      lastPurchaseQuantity: lastPurchase.quantity,
      lastPurchaseTotal: Number(lastPurchase.totalAmount)
    })
  } catch (error: any) {
    console.error("Error obteniendo último pedido:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo último pedido" },
      { status: 500 }
    )
  }
}


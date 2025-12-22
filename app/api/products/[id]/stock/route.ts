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

    // Buscar el stock del producto en la bodega
    const stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId
        }
      },
      include: {
        product: {
          select: {
            name: true,
            minStockThreshold: true
          }
        },
        warehouse: {
          select: {
            name: true
          }
        }
      }
    })

    if (!stock) {
      return NextResponse.json({
        quantity: 0,
        productName: null,
        warehouseName: null,
        minStockThreshold: null,
        isLowStock: false
      })
    }

    return NextResponse.json({
      quantity: stock.quantity,
      productName: stock.product.name,
      warehouseName: stock.warehouse.name,
      minStockThreshold: stock.product.minStockThreshold,
      isLowStock: stock.quantity < stock.product.minStockThreshold
    })
  } catch (error: any) {
    console.error("Error obteniendo stock:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo stock" },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    
    if (!companyId) {
      return NextResponse.json({ error: "companyId requerido" }, { status: 400 })
    }
    
    const whereClause: any = {
      type: "sale",
      product: { companyId }
    }
    
    if (from && to) {
      whereClause.movementDate = {
        gte: new Date(from),
        lte: new Date(to)
      }
    }
    
    // Agregaciones
    const totals = await prisma.movement.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true,
        profit: true,
        quantity: true
      }
    })
    
    const totalRevenue = Number(totals._sum.totalAmount || 0)
    const totalProfit = Number(totals._sum.profit || 0)
    const totalCost = totalRevenue - totalProfit
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    
    // Top productos por ganancia
    const topProducts = await prisma.movement.groupBy({
      by: ["productId"],
      where: whereClause,
      _sum: {
        profit: true,
        quantity: true
      },
      orderBy: {
        _sum: {
          profit: "desc"
        }
      },
      take: 10
    })
    
    // Enriquecer con datos del producto
    const enrichedTop = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })
        return {
          productId: item.productId,
          productName: product?.name || "Desconocido",
          profit: Number(item._sum.profit || 0),
          quantity: item._sum.quantity || 0
        }
      })
    )
    
    // Top bodegas por ganancia
    const topWarehouses = await prisma.movement.groupBy({
      by: ["warehouseId"],
      where: whereClause,
      _sum: {
        profit: true,
        totalAmount: true
      },
      orderBy: {
        _sum: {
          profit: "desc"
        }
      }
    })
    
    const enrichedWarehouses = await Promise.all(
      topWarehouses.map(async (item) => {
        const warehouse = await prisma.warehouse.findUnique({
          where: { id: item.warehouseId }
        })
        return {
          warehouseId: item.warehouseId,
          warehouseName: warehouse?.name || "Desconocida",
          profit: Number(item._sum.profit || 0),
          revenue: Number(item._sum.totalAmount || 0)
        }
      })
    )
    
    return NextResponse.json({
      totalRevenue,
      totalCost,
      netProfit: totalProfit,
      margin,
      topProducts: enrichedTop,
      topWarehouses: enrichedWarehouses
    })
  } catch (error: any) {
    console.error("Error en reporte de utilidad:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


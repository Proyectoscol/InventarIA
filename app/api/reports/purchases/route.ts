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
    const warehouseId = searchParams.get("warehouseId")
    const productId = searchParams.get("productId")
    
    if (!companyId) {
      return NextResponse.json({ error: "companyId requerido" }, { status: 400 })
    }
    
    const whereClause: any = {
      type: "purchase",
      product: { companyId }
    }
    
    if (from && to) {
      whereClause.movementDate = {
        gte: new Date(from),
        lte: new Date(to)
      }
    }
    
    if (warehouseId) whereClause.warehouseId = warehouseId
    if (productId) whereClause.productId = productId
    
    // Obtener movimientos
    const movements = await prisma.movement.findMany({
      where: whereClause,
      include: {
        product: true,
        warehouse: true,
        batch: true
      },
      orderBy: { movementDate: "desc" }
    })
    
    // Agregaciones
    const totals = await prisma.movement.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true,
        cashAmount: true,
        creditAmount: true,
        quantity: true
      },
      _count: true
    })
    
    // Compras por día
    const byDayMap = new Map<string, number>()
    movements.forEach(m => {
      const date = m.movementDate.toISOString().split("T")[0]
      byDayMap.set(date, (byDayMap.get(date) || 0) + Number(m.totalAmount))
    })
    
    const byDay = Array.from(byDayMap.entries()).map(([date, amount]) => ({
      date,
      amount
    })).sort((a, b) => a.date.localeCompare(b.date))
    
    return NextResponse.json({
      movements,
      totalAmount: Number(totals._sum.totalAmount || 0),
      cashAmount: Number(totals._sum.cashAmount || 0),
      creditAmount: Number(totals._sum.creditAmount || 0),
      totalQuantity: totals._sum.quantity || 0,
      count: totals._count,
      byDay
    })
  } catch (error: any) {
    console.error("Error en reporte de compras:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


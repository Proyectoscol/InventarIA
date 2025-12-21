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
      product: { companyId }
    }
    
    if (from && to) {
      whereClause.movementDate = {
        gte: new Date(from),
        lte: new Date(to)
      }
    }
    
    // Ventas (entradas de efectivo)
    const sales = await prisma.movement.aggregate({
      where: {
        ...whereClause,
        type: "sale"
      },
      _sum: {
        cashAmount: true,
        creditAmount: true,
        totalAmount: true
      }
    })
    
    // Compras (salidas de efectivo)
    const purchases = await prisma.movement.aggregate({
      where: {
        ...whereClause,
        type: "purchase"
      },
      _sum: {
        cashAmount: true,
        creditAmount: true,
        totalAmount: true
      }
    })
    
    // Créditos pagados
    const paidCredits = await prisma.movement.aggregate({
      where: {
        ...whereClause,
        type: "sale",
        creditPaid: true,
        creditAmount: { gt: 0 }
      },
      _sum: {
        creditAmount: true
      }
    })
    
    const cashIn = Number(sales._sum.cashAmount || 0) + Number(paidCredits._sum.creditAmount || 0)
    const cashOut = Number(purchases._sum.cashAmount || 0) + Number(purchases._sum.creditAmount || 0)
    const netCashFlow = cashIn - cashOut
    
    return NextResponse.json({
      cashIn,
      cashOut,
      netCashFlow,
      pendingCredits: Number(sales._sum.creditAmount || 0) - Number(paidCredits._sum.creditAmount || 0),
      totalSales: Number(sales._sum.totalAmount || 0),
      totalPurchases: Number(purchases._sum.totalAmount || 0)
    })
  } catch (error: any) {
    console.error("Error en reporte de flujo de caja:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


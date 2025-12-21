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
      product: { companyId },
      customerId: { not: null }
    }
    
    if (from && to) {
      whereClause.movementDate = {
        gte: new Date(from),
        lte: new Date(to)
      }
    }
    
    // Agrupar por cliente
    const customerStats = await prisma.movement.groupBy({
      by: ["customerId"],
      where: whereClause,
      _sum: {
        totalAmount: true,
        profit: true,
        quantity: true
      },
      _count: true
    })
    
    // Enriquecer con datos del cliente
    const enriched = await Promise.all(
      customerStats.map(async (stat) => {
        if (!stat.customerId) return null
        
        const customer = await prisma.customer.findUnique({
          where: { id: stat.customerId }
        })
        
        // Créditos pendientes del cliente
        const pendingCredits = await prisma.movement.aggregate({
          where: {
            ...whereClause,
            customerId: stat.customerId,
            creditPaid: false,
            creditAmount: { gt: 0 }
          },
          _sum: {
            creditAmount: true
          }
        })
        
        return {
          customer: {
            id: customer?.id,
            name: customer?.name,
            email: customer?.email,
            phone: customer?.phone
          },
          totalPurchases: stat._count,
          totalAmount: Number(stat._sum.totalAmount || 0),
          totalProfit: Number(stat._sum.profit || 0),
          totalQuantity: stat._sum.quantity || 0,
          pendingCredits: Number(pendingCredits._sum.creditAmount || 0)
        }
      })
    )
    
    const validStats = enriched.filter(Boolean)
    
    // Ordenar por total de compras
    validStats.sort((a, b) => (b?.totalAmount || 0) - (a?.totalAmount || 0))
    
    return NextResponse.json({ customers: validStats })
  } catch (error: any) {
    console.error("Error en reporte de clientes:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


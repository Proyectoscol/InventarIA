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
    
    // Obtener movimientos para cálculo manual
    const salesMovements = await prisma.movement.findMany({
      where: {
        ...whereClause,
        type: "sale"
      },
      select: {
        paymentType: true,
        cashAmount: true,
        creditAmount: true,
        totalAmount: true,
        creditPaid: true,
        creditPaidDate: true
      }
    })
    
    const purchaseMovements = await prisma.movement.findMany({
      where: {
        ...whereClause,
        type: "purchase"
      },
      select: {
        paymentType: true,
        cashAmount: true,
        creditAmount: true,
        totalAmount: true
      }
    })
    
    // Calcular contado recibido de ventas
    const salesCashAmount = salesMovements.reduce((sum, m) => {
      if (m.paymentType === "cash") {
        return sum + Number(m.cashAmount || m.totalAmount)
      } else if (m.paymentType === "mixed") {
        return sum + Number(m.cashAmount || 0)
      }
      return sum
    }, 0)
    
    // Calcular créditos pagados (solo los que tienen creditPaid = true y creditPaidDate)
    const paidCredits = salesMovements
      .filter(m => m.creditPaid && m.creditPaidDate && (m.paymentType === "credit" || m.paymentType === "mixed"))
      .reduce((sum, m) => {
        if (m.paymentType === "credit") {
          return sum + Number(m.creditAmount || m.totalAmount)
        } else if (m.paymentType === "mixed") {
          return sum + Number(m.creditAmount || 0)
        }
        return sum
      }, 0)
    
    // Calcular contado pagado en compras
    const purchasesCashAmount = purchaseMovements.reduce((sum, m) => {
      if (m.paymentType === "cash") {
        return sum + Number(m.cashAmount || m.totalAmount)
      } else if (m.paymentType === "mixed") {
        return sum + Number(m.cashAmount || 0)
      }
      return sum
    }, 0)
    
    // Calcular crédito pagado en compras
    const purchasesCreditAmount = purchaseMovements.reduce((sum, m) => {
      if (m.paymentType === "credit") {
        return sum + Number(m.creditAmount || m.totalAmount)
      } else if (m.paymentType === "mixed") {
        return sum + Number(m.creditAmount || 0)
      }
      return sum
    }, 0)
    
    const cashIn = salesCashAmount + paidCredits
    const cashOut = purchasesCashAmount + purchasesCreditAmount
    const netCashFlow = cashIn - cashOut
    
    // Totales para referencia
    const totalSales = salesMovements.reduce((sum, m) => sum + Number(m.totalAmount), 0)
    const totalPurchases = purchaseMovements.reduce((sum, m) => sum + Number(m.totalAmount), 0)
    
    // Créditos pendientes
    const pendingCredits = salesMovements
      .filter(m => !m.creditPaid && (m.paymentType === "credit" || m.paymentType === "mixed"))
      .reduce((sum, m) => {
        if (m.paymentType === "credit") {
          return sum + Number(m.creditAmount || m.totalAmount)
        } else if (m.paymentType === "mixed") {
          return sum + Number(m.creditAmount || 0)
        }
        return sum
      }, 0)
    
    return NextResponse.json({
      cashIn,
      cashOut,
      netCashFlow,
      pendingCredits,
      totalSales,
      totalPurchases
    })
  } catch (error: any) {
    console.error("Error en reporte de flujo de caja:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


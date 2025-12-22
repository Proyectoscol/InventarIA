import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getColombiaNow } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    const status = searchParams.get("status") // "pending", "overdue", "paid", "all"
    
    if (!companyId) {
      return NextResponse.json({ error: "companyId requerido" }, { status: 400 })
    }

    // Obtener fecha actual en Colombia
    const now = getColombiaNow()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Construir where clause según el estado
    const whereClause: any = {
      type: "sale",
      product: { companyId },
      creditAmount: { gt: 0 },
      creditDueDate: { not: null }
    }

    if (status === "pending") {
      // Pendientes (no vencidos y no pagados)
      whereClause.creditPaid = false
      whereClause.creditDueDate = { gt: today }
    } else if (status === "overdue") {
      // Vencidos (no pagados y fecha pasada)
      whereClause.creditPaid = false
      whereClause.creditDueDate = { lt: today }
    } else if (status === "paid") {
      // Pagados
      whereClause.creditPaid = true
    } else {
      // Todos los pendientes (no pagados)
      whereClause.creditPaid = false
    }

    const credits = await prisma.movement.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { name: true, phone: true }
        },
        product: {
          select: { name: true }
        },
        warehouse: {
          select: { name: true }
        }
      },
      orderBy: { creditDueDate: "asc" }
    })

    // Calcular días de vencimiento para cada crédito
    const creditsWithStatus = credits.map(m => {
      const dueDate = m.creditDueDate ? new Date(m.creditDueDate) : null
      let daysOverdue = 0
      let isOverdue = false

      if (dueDate && !m.creditPaid) {
        const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        daysOverdue = daysDiff
        isOverdue = daysDiff > 0
      }

      return {
        ...m,
        creditAmount: Number(m.creditAmount),
        cashAmount: m.cashAmount ? Number(m.cashAmount) : null,
        totalAmount: Number(m.totalAmount),
        creditDueDate: dueDate,
        daysOverdue,
        isOverdue,
        status: m.creditPaid ? "paid" : (isOverdue ? "overdue" : "pending")
      }
    })

    // Calcular resumen
    const summary = {
      total: creditsWithStatus.length,
      pending: creditsWithStatus.filter(c => c.status === "pending").length,
      overdue: creditsWithStatus.filter(c => c.status === "overdue").length,
      paid: creditsWithStatus.filter(c => c.status === "paid").length,
      totalPendingAmount: creditsWithStatus
        .filter(c => !c.creditPaid)
        .reduce((sum, c) => sum + c.creditAmount, 0),
      totalOverdueAmount: creditsWithStatus
        .filter(c => c.isOverdue)
        .reduce((sum, c) => sum + c.creditAmount, 0)
    }

    return NextResponse.json({
      credits: creditsWithStatus,
      summary
    })
  } catch (error: any) {
    console.error("Error obteniendo créditos:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo créditos" },
      { status: 500 }
    )
  }
}


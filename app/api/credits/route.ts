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

// Nueva funcionalidad: Abonar a créditos
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()
    const { movementId, paymentAmount, newDueDate, notes } = data

    if (!movementId || !paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    // Obtener el movimiento original
    const movement = await prisma.movement.findUnique({
      where: { id: movementId },
      include: { customer: true, product: true }
    })

    if (!movement) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 })
    }

    if (movement.type !== "sale") {
      return NextResponse.json({ error: "Solo se pueden abonar créditos de ventas" }, { status: 400 })
    }

    const currentCreditAmount = Number(movement.creditAmount || 0)
    const currentCashAmount = Number(movement.cashAmount || 0)

    if (currentCreditAmount <= 0) {
      return NextResponse.json({ error: "Este movimiento no tiene crédito pendiente" }, { status: 400 })
    }

    if (paymentAmount > currentCreditAmount) {
      return NextResponse.json({ error: "El monto del abono no puede ser mayor al crédito pendiente" }, { status: 400 })
    }

    // Calcular nuevo saldo
    const newCreditAmount = currentCreditAmount - paymentAmount
    const newCashAmount = currentCashAmount + paymentAmount

    // Generar número de movimiento para el abono
    const lastMovement = await prisma.movement.findFirst({
      where: {
        type: "sale",
        movementNumber: { startsWith: "ABO-" }
      },
      orderBy: { movementNumber: "desc" }
    })

    const lastNumber = lastMovement
      ? parseInt(lastMovement.movementNumber.split("-")[1])
      : 0
    const movementNumber = `ABO-${String(lastNumber + 1).padStart(6, "0")}`

    // Crear registro de abono
    const abono = await prisma.movement.create({
      data: {
        movementNumber,
        type: "sale", // Los abonos son movimientos de venta tipo ingreso
        productId: movement.productId,
        warehouseId: movement.warehouseId,
        quantity: 0, // Los abonos no afectan inventario
        unitPrice: paymentAmount,
        totalAmount: paymentAmount,
        paymentType: "cash", // Los abonos siempre son en contado
        cashAmount: paymentAmount,
        creditAmount: null,
        customerId: movement.customerId,
        notes: `Abono a crédito ${movement.movementNumber}. ${notes || ""}`.trim(),
        movementDate: new Date()
      }
    })

    // Actualizar el movimiento original
    const updatedMovement = await prisma.movement.update({
      where: { id: movementId },
      data: {
        creditAmount: newCreditAmount,
        cashAmount: newCashAmount,
        // Si el crédito se paga completamente, marcarlo como pagado
        ...(newCreditAmount <= 0 && {
          creditPaid: true,
          creditPaidDate: new Date()
        }),
        // Si hay nueva fecha de vencimiento, actualizarla
        ...(newDueDate && {
          creditDueDate: new Date(newDueDate)
        })
      },
      include: {
        customer: true,
        product: true,
        warehouse: true
      }
    })

    return NextResponse.json({
      success: true,
      movement: updatedMovement,
      abono,
      remainingCredit: newCreditAmount
    })

  } catch (error: any) {
    console.error("Error creando abono:", error)
    return NextResponse.json(
      { error: error.message || "Error creando abono" },
      { status: 500 }
    )
  }
}


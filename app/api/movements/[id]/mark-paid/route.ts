import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const movementId = params.id
    const data = await req.json()
    const paidDate = data.paidDate ? new Date(data.paidDate) : new Date()

    // Verificar que el movimiento existe y tiene crédito
    const movement = await prisma.movement.findUnique({
      where: { id: movementId },
      include: {
        product: true,
        customer: true
      }
    })

    if (!movement) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 })
    }

    if (movement.type !== "sale") {
      return NextResponse.json({ error: "Solo se pueden marcar como pagados los créditos de ventas" }, { status: 400 })
    }

    if (movement.paymentType === "cash") {
      return NextResponse.json({ error: "Este movimiento ya fue pagado en contado" }, { status: 400 })
    }

    const creditAmountNum = movement.creditAmount ? Number(movement.creditAmount) : 0
    if (creditAmountNum <= 0) {
      return NextResponse.json({ error: "Este movimiento no tiene crédito pendiente" }, { status: 400 })
    }

    if (movement.creditPaid) {
      return NextResponse.json({ error: "Este crédito ya fue marcado como pagado" }, { status: 400 })
    }

    // Si es pago mixto, sumar el crédito al contado recibido
    let newCashAmount = movement.cashAmount ? Number(movement.cashAmount) : 0
    if (movement.paymentType === "mixed") {
      newCashAmount = newCashAmount + creditAmountNum
    }

    // Actualizar el movimiento
    const updated = await prisma.movement.update({
      where: { id: movementId },
      data: {
        creditPaid: true,
        creditPaidDate: paidDate,
        // Si es pago mixto, actualizar cashAmount sumando el crédito pagado
        ...(movement.paymentType === "mixed" && {
          cashAmount: newCashAmount
        })
      },
      include: {
        product: true,
        customer: true,
        warehouse: true
      }
    })

    console.log(`✅ Crédito marcado como pagado: ${movement.movementNumber}, fecha: ${paidDate.toISOString()}`)

    return NextResponse.json({
      success: true,
      movement: {
        ...updated,
        creditAmount: Number(updated.creditAmount),
        cashAmount: updated.cashAmount ? Number(updated.cashAmount) : null,
        creditPaidDate: updated.creditPaidDate
      }
    })
  } catch (error: any) {
    console.error("Error marcando crédito como pagado:", error)
    return NextResponse.json(
      { error: error.message || "Error marcando crédito como pagado" },
      { status: 500 }
    )
  }
}


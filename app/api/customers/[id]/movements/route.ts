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

    const customerId = params.id
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "companyId requerido" }, { status: 400 })
    }

    // Verificar que el cliente pertenece a la compañía
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { companyId: true }
    })

    if (!customer || customer.companyId !== companyId) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Obtener todos los movimientos (ventas) del cliente
    const movements = await prisma.movement.findMany({
      where: {
        customerId,
        type: "sale",
        product: { companyId }
      },
      include: {
        product: {
          select: { name: true }
        },
        warehouse: {
          select: { name: true }
        }
      },
      orderBy: { movementDate: "desc" }
    })

    // Calcular resumen
    const totalSales = movements.reduce((sum, m) => sum + Number(m.totalAmount), 0)
    const totalProfit = movements.reduce((sum, m) => sum + Number(m.profit || 0), 0)
    
    // Para contado: basarse en paymentType
    const totalCash = movements.reduce((sum, m) => {
      if (m.paymentType === "cash") {
        // Si es contado, usar cashAmount si existe, sino usar totalAmount
        return sum + Number(m.cashAmount ?? m.totalAmount)
      } else if (m.paymentType === "mixed") {
        // Si es mixto, usar cashAmount (debe estar guardado)
        return sum + Number(m.cashAmount ?? 0)
      }
      // Si es crédito, no sumar nada a contado
      return sum
    }, 0)
    
    // Para crédito: basarse en paymentType
    const totalCredit = movements.reduce((sum, m) => {
      if (m.paymentType === "credit") {
        // Si es crédito, usar creditAmount si existe, sino usar totalAmount
        return sum + Number(m.creditAmount ?? m.totalAmount)
      } else if (m.paymentType === "mixed") {
        // Si es mixto, usar creditAmount (debe estar guardado)
        return sum + Number(m.creditAmount ?? 0)
      }
      // Si es contado, no sumar nada a crédito
      return sum
    }, 0)
    
    // Créditos pendientes (solo los que no han sido pagados)
    const pendingCredit = movements
      .filter(m => !m.creditPaid && (m.paymentType === "credit" || m.paymentType === "mixed"))
      .reduce((sum, m) => {
        if (m.paymentType === "credit") {
          // Si es crédito puro, usar creditAmount si existe, sino usar totalAmount
          return sum + Number(m.creditAmount ?? m.totalAmount)
        } else if (m.paymentType === "mixed") {
          // Si es mixto, usar creditAmount (debe estar guardado)
          return sum + Number(m.creditAmount ?? 0)
        }
        return sum
      }, 0)
    const totalQuantity = movements.reduce((sum, m) => sum + m.quantity, 0)

    return NextResponse.json({
      movements: movements.map(m => ({
        ...m,
        unitPrice: Number(m.unitPrice),
        totalAmount: Number(m.totalAmount),
        cashAmount: m.paymentType === "cash" ? Number(m.cashAmount ?? m.totalAmount) : (m.paymentType === "mixed" ? Number(m.cashAmount ?? 0) : null),
        creditAmount: m.paymentType === "credit" ? Number(m.creditAmount ?? m.totalAmount) : (m.paymentType === "mixed" ? Number(m.creditAmount ?? 0) : null),
        creditDays: m.creditDays ? Number(m.creditDays) : null,
        shippingCost: m.shippingCost ? Number(m.shippingCost) : null,
        unitCost: m.unitCost ? Number(m.unitCost) : null,
        profit: m.profit ? Number(m.profit) : null,
      })),
      summary: {
        totalMovements: movements.length,
        totalSales,
        totalProfit,
        totalCash,
        totalCredit,
        pendingCredit,
        totalQuantity
      }
    })
  } catch (error: any) {
    console.error("Error obteniendo movimientos del cliente:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo movimientos del cliente" },
      { status: 500 }
    )
  }
}


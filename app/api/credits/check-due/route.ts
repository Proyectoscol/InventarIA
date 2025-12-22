import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendCreditDueAlert } from "@/lib/email"
import { getColombiaNow } from "@/lib/date-utils"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()
    const companyId = data.companyId

    if (!companyId) {
      return NextResponse.json({ error: "companyId requerido" }, { status: 400 })
    }

    // Obtener fecha actual en Colombia
    const now = getColombiaNow()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Buscar créditos pendientes que vencen hoy o están vencidos
    const dueCredits = await prisma.movement.findMany({
      where: {
        type: "sale",
        product: { companyId },
        creditPaid: false,
        creditAmount: { gt: 0 },
        creditDueDate: { not: null },
        OR: [
          { creditDueDate: { lte: today } }, // Vencidos
          { creditDueDate: { gte: today, lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) } } // Vencen hoy
        ]
      },
      include: {
        customer: {
          select: { name: true }
        },
        product: {
          select: { name: true }
        }
      },
      orderBy: { creditDueDate: "asc" }
    })

    if (dueCredits.length === 0) {
      return NextResponse.json({
        message: "No hay créditos vencidos o por vencer",
        count: 0
      })
    }

    // Obtener configuración de alertas
    const alertConfig = await prisma.alertConfig.findUnique({
      where: { companyId }
    })

    if (!alertConfig || !alertConfig.enableAlerts || alertConfig.alertEmails.length === 0) {
      return NextResponse.json({
        message: "Alertas deshabilitadas o sin emails configurados",
        credits: dueCredits.length,
        notified: false
      })
    }

    // Preparar datos para el email
    const movementsForEmail = dueCredits.map(m => {
      const dueDate = m.creditDueDate ? new Date(m.creditDueDate) : new Date()
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        movementNumber: m.movementNumber,
        customerName: m.customer?.name || "Sin cliente",
        productName: m.product.name,
        creditAmount: Number(m.creditAmount),
        dueDate: dueDate,
        daysOverdue: daysDiff > 0 ? daysDiff : undefined
      }
    })

    // Enviar alerta
    try {
      await sendCreditDueAlert({
        to: alertConfig.alertEmails,
        movements: movementsForEmail
      })

      console.log(`✅ Alerta de créditos enviada para ${dueCredits.length} créditos`)

      return NextResponse.json({
        success: true,
        message: "Alerta de créditos enviada",
        credits: dueCredits.length,
        notified: true,
        movements: movementsForEmail
      })
    } catch (emailError: any) {
      console.error("Error enviando alerta de créditos:", emailError)
      return NextResponse.json({
        success: false,
        message: "Error enviando alerta",
        credits: dueCredits.length,
        notified: false,
        error: emailError.message
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error verificando créditos vencidos:", error)
    return NextResponse.json(
      { error: error.message || "Error verificando créditos vencidos" },
      { status: 500 }
    )
  }
}


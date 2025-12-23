import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendCreditDueAlert } from "@/lib/email"
import { getColombiaNow } from "@/lib/date-utils"
import { getCompanyUserEmails } from "@/lib/company-users"

// Este endpoint puede ser llamado por un cron job externo o por un servicio de scheduling
// Para Easypanel, puedes configurar un cron job que llame a este endpoint periódicamente
export async function GET(req: NextRequest) {
  try {
    // Verificar que viene de una fuente autorizada (opcional, para seguridad)
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener todas las compañías (verificaremos usuarios y alertas después)
    const companies = await prisma.company.findMany({
      include: {
        alertConfig: true
      }
    })

    const results = []

    for (const company of companies) {
      // Obtener emails de usuarios de la compañía
      const userEmails = await getCompanyUserEmails(company.id)
      
      if (userEmails.length === 0) {
        console.log(`⚠️  No hay usuarios con email para la compañía ${company.name}`)
        continue
      }
      
      // Verificar si las alertas están habilitadas (opcional, para compatibilidad)
      if (company.alertConfig && !company.alertConfig.enableAlerts) {
        console.log(`ℹ️  Alertas deshabilitadas para la compañía ${company.name}`)
        continue
      }

      // Obtener fecha actual en Colombia
      const now = getColombiaNow()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Buscar créditos pendientes que vencen hoy o están vencidos
      const dueCredits = await prisma.movement.findMany({
        where: {
          type: "sale",
          product: { companyId: company.id },
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

      if (dueCredits.length > 0) {
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

        try {
          await sendCreditDueAlert({
            to: userEmails,
            movements: movementsForEmail
          })

          results.push({
            companyId: company.id,
            companyName: company.name,
            credits: dueCredits.length,
            notified: true
          })

          console.log(`✅ Alerta de créditos enviada para ${company.name}: ${dueCredits.length} créditos`)
        } catch (emailError: any) {
          console.error(`❌ Error enviando alerta para ${company.name}:`, emailError)
          results.push({
            companyId: company.id,
            companyName: company.name,
            credits: dueCredits.length,
            notified: false,
            error: emailError.message
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verificación de créditos completada",
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error: any) {
    console.error("Error en verificación de créditos:", error)
    return NextResponse.json(
      { error: error.message || "Error verificando créditos vencidos" },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getColombiaDayRange } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    const date = searchParams.get("date")
    
    if (!companyId || !date) {
      return NextResponse.json({ error: "companyId y date requeridos" }, { status: 400 })
    }

    // Crear rango del día en zona horaria de Colombia (00:00:00 a 23:59:59)
    const { start: startDate, end: endDate } = getColombiaDayRange(date)

    // Obtener movimientos del día
    const movements = await prisma.movement.findMany({
      where: {
        product: { companyId },
        movementDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        product: true,
        warehouse: true,
        customer: true,
        batch: true
      },
      orderBy: { movementDate: "asc" }
    })

    // Calcular resumen del día
    const purchases = movements.filter(m => m.type === "purchase")
    const sales = movements.filter(m => m.type === "sale")
    
    const totalPurchases = purchases.reduce((sum, m) => sum + Number(m.totalAmount), 0)
    const totalSales = sales.reduce((sum, m) => sum + Number(m.totalAmount), 0)
    const totalProfit = sales.reduce((sum, m) => sum + Number(m.profit || 0), 0)

    return NextResponse.json({
      movements,
      summary: {
        totalPurchases,
        totalSales,
        totalProfit,
        purchasesCount: purchases.length,
        salesCount: sales.length
      }
    })
  } catch (error: any) {
    console.error("Error obteniendo movimientos por fecha:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


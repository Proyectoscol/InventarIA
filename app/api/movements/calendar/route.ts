import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getColombiaDay } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    const year = searchParams.get("year")
    const month = searchParams.get("month")
    
    if (!companyId || !year || !month) {
      return NextResponse.json({ error: "companyId, year y month requeridos" }, { status: 400 })
    }

    // Calcular rango de fechas del mes
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

    // Obtener todos los movimientos del mes
    const movements = await prisma.movement.findMany({
      where: {
        product: { companyId },
        movementDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        movementDate: true,
        type: true
      }
    })

    // Agrupar por día en zona horaria de Colombia
    const daysWithActivity = new Set<string>()
    movements.forEach(m => {
      const day = getColombiaDay(m.movementDate)
      daysWithActivity.add(day.toString())
    })

    return NextResponse.json({
      daysWithActivity: Array.from(daysWithActivity).map(d => parseInt(d))
    })
  } catch (error: any) {
    console.error("Error obteniendo calendario:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


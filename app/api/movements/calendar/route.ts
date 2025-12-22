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

    // Calcular rango de fechas del mes en UTC
    // El mes se interpreta en zona horaria de Colombia
    // Inicio del mes: 1er día 00:00 Colombia = 05:00 UTC del mismo día
    const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 5, 0, 0, 0))
    // Fin del mes: último día 23:59 Colombia = 04:59 UTC del día siguiente
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
    const endDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, lastDay + 1, 4, 59, 59, 999))

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


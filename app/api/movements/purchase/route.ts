import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getColombiaNow } from "@/lib/date-utils"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()
    
    // Calcular precio unitario
    const unitCost = data.priceType === "unit"
      ? data.price
      : data.price / data.quantity
    
    // Generar número de lote
    const lastBatch = await prisma.batch.findFirst({
      where: { batchNumber: { startsWith: "ING-" } },
      orderBy: { batchNumber: "desc" }
    })
    
    const lastNumber = lastBatch
      ? parseInt(lastBatch.batchNumber.split("-")[1])
      : 0
    const batchNumber = `ING-${String(lastNumber + 1).padStart(6, "0")}`
    
    // Transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear lote
      const batch = await tx.batch.create({
        data: {
          batchNumber,
          productId: data.productId,
          warehouseId: data.warehouseId,
          initialQuantity: data.quantity,
          remainingQty: data.quantity,
          unitCost
        }
      })
      
      // Actualizar stock
      await tx.stock.upsert({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId
          }
        },
        update: {
          quantity: { increment: data.quantity }
        },
        create: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.quantity
        }
      })
      
      // Crear movimiento con fecha en zona horaria de Colombia
      const movement = await tx.movement.create({
        data: {
          movementNumber: batchNumber,
          type: "purchase",
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          unitPrice: unitCost,
          totalAmount: unitCost * data.quantity,
          paymentType: data.paymentType,
          cashAmount: data.cashAmount,
          creditAmount: data.creditAmount,
          creditPaid: data.paymentType === "cash",
          notes: data.notes,
          movementDate: data.movementDate ? new Date(data.movementDate) : getColombiaNow()
        }
      })
      
      return { batch, movement }
    })
    
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error en compra:", error)
    return NextResponse.json(
      { error: error.message || "Error procesando compra" },
      { status: 500 }
    )
  }
}


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

    const data = await req.json()
    const returnQuantity = data.quantity || 0

    // Obtener venta original
    const sale = await prisma.movement.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        warehouse: true
      }
    })

    if (!sale || sale.type !== "sale") {
      return NextResponse.json(
        { error: "Solo se pueden devolver ventas" },
        { status: 400 }
      )
    }

    if (returnQuantity > sale.quantity) {
      return NextResponse.json(
        { error: "La cantidad a devolver no puede ser mayor a la vendida" },
        { status: 400 }
      )
    }

    // Crear lote de devolución (como si fuera una compra)
    const lastBatch = await prisma.batch.findFirst({
      where: { batchNumber: { startsWith: "DEV-" } },
      orderBy: { batchNumber: "desc" }
    })

    const lastNumber = lastBatch
      ? parseInt(lastBatch.batchNumber.split("-")[1])
      : 0
    const batchNumber = `DEV-${String(lastNumber + 1).padStart(6, "0")}`

    // Usar el costo unitario de la venta original
    const unitCost = sale.unitCost || sale.unitPrice

    // Transacción para crear devolución
    const result = await prisma.$transaction(async (tx) => {
      // Crear lote de devolución
      const batch = await tx.batch.create({
        data: {
          batchNumber,
          productId: sale.productId,
          warehouseId: sale.warehouseId,
          initialQuantity: returnQuantity,
          remainingQty: returnQuantity,
          unitCost: Number(unitCost)
        }
      })

      // Actualizar stock
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: sale.productId,
            warehouseId: sale.warehouseId
          }
        },
        data: {
          quantity: { increment: returnQuantity }
        }
      })

      // Crear movimiento de devolución (tipo purchase pero con nota especial)
      const movement = await tx.movement.create({
        data: {
          movementNumber: batchNumber,
          type: "purchase",
          productId: sale.productId,
          warehouseId: sale.warehouseId,
          quantity: returnQuantity,
          unitPrice: Number(unitCost),
          totalAmount: Number(unitCost) * returnQuantity,
          paymentType: "cash",
          creditPaid: true,
          notes: `Devolución de venta ${sale.movementNumber}. Cantidad devuelta: ${returnQuantity}`
        }
      })

      return { batch, movement }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error procesando devolución:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


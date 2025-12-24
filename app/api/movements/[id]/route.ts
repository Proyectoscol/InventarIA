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

    const movement = await prisma.movement.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        warehouse: true,
        customer: true,
        batch: true
      }
    })

    if (!movement) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 })
    }

    return NextResponse.json(movement)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()
    const movementId = params.id

    // Obtener movimiento original
    const original = await prisma.movement.findUnique({
      where: { id: movementId },
      include: {
        product: true,
        warehouse: true,
        batch: true
      }
    })

    if (!original) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 })
    }

    // Solo permitir editar ventas por ahora
    if (original.type !== "sale") {
      return NextResponse.json({ error: "Solo se pueden editar ventas" }, { status: 400 })
    }

    // Revertir el movimiento original (devolver stock)
    await prisma.stock.update({
      where: {
        productId_warehouseId: {
          productId: original.productId,
          warehouseId: original.warehouseId
        }
      },
      data: {
        quantity: { increment: original.quantity }
      }
    })

    // Revertir lotes
    if (original.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: original.batchId }
      })
      if (batch) {
        await prisma.batch.update({
          where: { id: original.batchId },
          data: {
            remainingQty: { increment: original.quantity }
          }
        })
      }
    }

    // Validar stock disponible para el nuevo movimiento
    const stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId: data.productId,
          warehouseId: data.warehouseId
        }
      }
    })
    
    if (!stock || stock.quantity < data.quantity) {
      // Revertir la reversión si no hay stock
      await prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId: original.productId,
            warehouseId: original.warehouseId
          }
        },
        data: {
          quantity: { decrement: original.quantity }
        }
      })
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${stock?.quantity || 0}` },
        { status: 400 }
      )
    }

    // Obtener lotes FIFO para el nuevo producto/bodega
    const batches = await prisma.batch.findMany({
      where: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        remainingQty: { gt: 0 }
      },
      orderBy: { purchaseDate: "asc" }
    })
    
    if (batches.length === 0) {
      return NextResponse.json(
        { error: "No hay lotes disponibles para este producto" },
        { status: 400 }
      )
    }

    // Aplicar FIFO y calcular costo
    let remainingToSell = data.quantity
    let totalCost = 0
    const batchUpdates: Array<{ batchId: string; newRemaining: number }> = []
    
    for (const batch of batches) {
      if (remainingToSell <= 0) break
      
      const qtyFromBatch = Math.min(batch.remainingQty, remainingToSell)
      const costFromBatch = qtyFromBatch * Number(batch.unitCost)
      
      totalCost += costFromBatch
      remainingToSell -= qtyFromBatch
      
      batchUpdates.push({
        batchId: batch.id,
        newRemaining: batch.remainingQty - qtyFromBatch
      })
    }
    
    const unitCost = totalCost / data.quantity
    const profit = (data.unitPrice - unitCost) * data.quantity

    // Calcular fecha de vencimiento de crédito si aplica
    let creditDueDate = null
    if ((data.paymentType === "credit" || data.paymentType === "mixed") && data.creditDays) {
      creditDueDate = new Date(original.movementDate)
      creditDueDate.setDate(creditDueDate.getDate() + data.creditDays)
    }

    // Actualizar lotes
    for (const update of batchUpdates) {
      await prisma.batch.update({
        where: { id: update.batchId },
        data: { remainingQty: update.newRemaining }
      })
    }

    // Actualizar stock
    await prisma.stock.update({
      where: {
        productId_warehouseId: {
          productId: data.productId,
          warehouseId: data.warehouseId
        }
      },
      data: {
        quantity: { decrement: data.quantity }
      }
    })

    // Actualizar el movimiento (mantener número y fecha originales)
    const updated = await prisma.movement.update({
      where: { id: movementId },
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalAmount: data.unitPrice * data.quantity,
        paymentType: data.paymentType,
        cashAmount: data.cashAmount,
        creditAmount: data.creditAmount,
        creditDays: data.creditDays,
        creditDueDate: creditDueDate,
        profit: profit,
        hasShipping: data.hasShipping || false,
        shippingCost: data.shippingCost,
        shippingPaidBy: data.shippingPaidBy,
        notes: data.notes,
        // Mantener número de movimiento y fecha originales
        // movementNumber: original.movementNumber,
        // movementDate: original.movementDate,
        batchId: batchUpdates[0]?.batchId || null
      },
      include: {
        product: true,
        warehouse: true,
        customer: true
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error editando movimiento:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const movement = await prisma.movement.findUnique({
      where: { id: params.id }
    })

    if (!movement) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 })
    }

    // Revertir cambios según el tipo
    if (movement.type === "sale") {
      // Devolver stock
      await prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId: movement.productId,
            warehouseId: movement.warehouseId
          }
        },
        data: {
          quantity: { increment: movement.quantity }
        }
      })

      // Revertir lotes si existe
      if (movement.batchId) {
        const batch = await prisma.batch.findUnique({
          where: { id: movement.batchId }
        })
        if (batch) {
          await prisma.batch.update({
            where: { id: movement.batchId },
            data: {
              remainingQty: { increment: movement.quantity }
            }
          })
        }
      }
    } else if (movement.type === "purchase") {
      // Reducir stock
      await prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId: movement.productId,
            warehouseId: movement.warehouseId
          }
        },
        data: {
          quantity: { decrement: movement.quantity }
        }
      })

      // Eliminar lote
      if (movement.batchId) {
        await prisma.batch.delete({
          where: { id: movement.batchId }
        })
      }
    }

    // Eliminar movimiento
    await prisma.movement.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error eliminando movimiento:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


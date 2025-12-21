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

    // Si es una venta, revertir el stock y lotes
    if (original.type === "sale") {
      // Revertir stock
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

      // Revertir lotes (simplificado - en producción necesitarías tracking más detallado)
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
    }

    // Si es una compra, revertir stock y eliminar lote
    if (original.type === "purchase") {
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

      if (original.batchId) {
        await prisma.batch.delete({
          where: { id: original.batchId }
        })
      }
    }

    // Eliminar movimiento original
    await prisma.movement.delete({
      where: { id: movementId }
    })

    // Crear nuevo movimiento con datos actualizados
    // Esto requiere llamar a las funciones de purchase/sale según el tipo
    // Por simplicidad, retornamos éxito y el frontend debe recrear el movimiento
    return NextResponse.json({ 
      success: true,
      message: "Movimiento revertido. Por favor, crea un nuevo movimiento con los datos correctos."
    })
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


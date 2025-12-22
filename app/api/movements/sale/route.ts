import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendStockAlert } from "@/lib/email"

async function checkAndSendCreditAlert(companyId: string) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/credits/check-due`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId })
    })
    if (res.ok) {
      const data = await res.json()
      if (data.notified) {
        console.log(`✅ Alerta de créditos enviada: ${data.credits} créditos`)
      }
    }
  } catch (error) {
    console.error("Error verificando créditos vencidos:", error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()
    
    // LOGS DE DEBUG - Ver qué datos están llegando
    console.log("=== VENTA RECIBIDA ===")
    console.log("paymentType:", data.paymentType)
    console.log("cashAmount:", data.cashAmount)
    console.log("creditAmount:", data.creditAmount)
    console.log("creditDays:", data.creditDays)
    console.log("totalAmount calculado:", data.unitPrice * data.quantity)
    console.log("Datos completos:", JSON.stringify(data, null, 2))
    
    // 1. Validar stock disponible
    const stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId: data.productId,
          warehouseId: data.warehouseId
        }
      }
    })
    
    if (!stock || stock.quantity < data.quantity) {
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${stock?.quantity || 0}` },
        { status: 400 }
      )
    }
    
    // 2. Obtener lotes FIFO
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
    
    // 3. Aplicar FIFO y calcular costo
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
    
    // 4. Calcular ganancia
    let profit = (data.unitPrice - unitCost) * data.quantity
    
    if (data.hasShipping && data.shippingPaidBy === "seller") {
      profit -= data.shippingCost || 0
    }
    
    // 5. Generar número de movimiento
    const lastMovement = await prisma.movement.findFirst({
      where: {
        type: "sale",
        movementNumber: { startsWith: "VEN-" }
      },
      orderBy: { movementNumber: "desc" }
    })
    
    const lastNumber = lastMovement
      ? parseInt(lastMovement.movementNumber.split("-")[1])
      : 0
    const movementNumber = `VEN-${String(lastNumber + 1).padStart(6, "0")}`
    
    // 6. Transacción: actualizar todo
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar lotes
      for (const update of batchUpdates) {
        await tx.batch.update({
          where: { id: update.batchId },
          data: { remainingQty: update.newRemaining }
        })
      }
      
      // Calcular totalAmount
      const totalAmount = data.unitPrice * data.quantity
      
      // LOGS DE DEBUG - Antes de crear el movimiento
      console.log("=== CREANDO MOVIMIENTO ===")
      console.log("paymentType recibido:", data.paymentType)
      console.log("paymentType tipo:", typeof data.paymentType)
      console.log("cashAmount recibido:", data.cashAmount)
      console.log("creditAmount recibido:", data.creditAmount)
      console.log("creditDays recibido:", data.creditDays)
      console.log("totalAmount:", totalAmount)
      
      // Determinar valores finales
      let finalCashAmount: number | null = null
      let finalCreditAmount: number | null = null
      let finalCreditDays: number | null = null
      let finalCreditDueDate: Date | null = null
      
      // Calcular fecha de vencimiento si hay crédito
      if ((data.paymentType === "credit" || data.paymentType === "mixed") && data.creditDays) {
        const movementDate = new Date() // Fecha actual (se guardará en movementDate)
        finalCreditDueDate = new Date(movementDate)
        finalCreditDueDate.setDate(finalCreditDueDate.getDate() + data.creditDays)
      }
      
      if (data.paymentType === "cash") {
        finalCashAmount = totalAmount
        finalCreditAmount = null
        finalCreditDays = null
        finalCreditDueDate = null
      } else if (data.paymentType === "credit") {
        finalCashAmount = null
        finalCreditAmount = totalAmount
        finalCreditDays = data.creditDays || null
      } else if (data.paymentType === "mixed") {
        finalCashAmount = data.cashAmount || 0
        finalCreditAmount = data.creditAmount || 0
        finalCreditDays = data.creditDays || null
      }
      
      console.log("Valores finales para DB:")
      console.log("  cashAmount:", finalCashAmount)
      console.log("  creditAmount:", finalCreditAmount)
      console.log("  creditDays:", finalCreditDays)
      console.log("  creditDueDate:", finalCreditDueDate)
      console.log("  creditPaid:", data.paymentType === "cash")
      
      // Crear movimiento con fecha en zona horaria de Colombia
      const movement = await tx.movement.create({
        data: {
          movementNumber,
          type: "sale",
          productId: data.productId,
          warehouseId: data.warehouseId,
          batchId: batchUpdates[0].batchId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalAmount: totalAmount,
          unitCost,
          profit,
          paymentType: data.paymentType,
          cashAmount: finalCashAmount,
          creditAmount: finalCreditAmount,
          creditDays: finalCreditDays,
          creditDueDate: finalCreditDueDate,
          creditPaid: data.paymentType === "cash",
          creditPaidDate: null, // Se establecerá cuando se marque como pagado
          hasShipping: data.hasShipping || false,
          shippingCost: data.shippingCost,
          shippingPaidBy: data.shippingPaidBy,
          customerId: data.customerId && data.customerId.trim() !== "" ? data.customerId : null,
          notes: data.notes
          // movementDate se establece automáticamente por el schema con default: now()
          // Si se necesita una fecha específica, se puede pasar en data.movementDate
        }
      })
      
      // Actualizar stock
      await tx.stock.update({
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
      
      return movement
    })
    
    // 7. VERIFICAR Y ENVIAR ALERTAS (fuera de transacción)
    try {
      // Alerta de stock bajo
      await checkAndSendStockAlert({
        productId: data.productId,
        warehouseId: data.warehouseId,
        companyId: data.companyId
      })
    } catch (alertError) {
      console.error("❌ Error enviando alerta de stock:", alertError)
      // No fallar la venta si falla el email
    }
    
    // Si hay crédito, verificar créditos vencidos después de un delay
    const creditAmountNum = result.creditAmount ? Number(result.creditAmount) : 0
    if (creditAmountNum > 0 && result.creditDueDate) {
      setTimeout(async () => {
        try {
          await checkAndSendCreditAlert(data.companyId)
        } catch (creditAlertError) {
          console.error("❌ Error verificando créditos vencidos:", creditAlertError)
        }
      }, 2000) // Esperar 2 segundos para que el movimiento esté guardado
    }
    
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error en venta:", error)
    return NextResponse.json(
      { error: error.message || "Error procesando venta" },
      { status: 500 }
    )
  }
}

async function checkAndSendStockAlert({
  productId,
  warehouseId,
  companyId
}: {
  productId: string
  warehouseId: string
  companyId: string
}) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      stock: { where: { warehouseId } }
    }
  })
  
  if (!product) return
  
  const currentStock = product.stock[0]?.quantity || 0
  
  if (currentStock >= product.minStockThreshold) {
    return
  }
  
  const alertConfig = await prisma.alertConfig.findUnique({
    where: { companyId }
  })
  
  if (!alertConfig || !alertConfig.enableAlerts || alertConfig.alertEmails.length === 0) {
    return
  }
  
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId }
  })
  
  const lastBatch = await prisma.batch.findFirst({
    where: { productId },
    orderBy: { purchaseDate: "desc" }
  })
  
  await sendStockAlert({
    to: alertConfig.alertEmails,
    productName: product.name,
    warehouseName: warehouse?.name || "Desconocida",
    currentStock,
    threshold: product.minStockThreshold,
    belowBy: product.minStockThreshold - currentStock,
    lastUnitCost: Number(lastBatch?.unitCost || 0)
  })
}


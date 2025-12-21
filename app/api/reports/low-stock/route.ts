import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    
    if (!companyId) {
      return NextResponse.json({ error: "companyId requerido" }, { status: 400 })
    }
    
    // Obtener productos con stock bajo
    const products = await prisma.product.findMany({
      where: { companyId },
      include: {
        stock: {
          include: {
            warehouse: true
          }
        }
      }
    })
    
    const lowStockProducts = products
      .map(product => {
        const lowStockWarehouses = product.stock.filter(
          s => s.quantity < product.minStockThreshold
        )
        
        if (lowStockWarehouses.length === 0) return null
        
        return {
          product: {
            id: product.id,
            name: product.name,
            minStockThreshold: product.minStockThreshold
          },
          warehouses: lowStockWarehouses.map(s => ({
            warehouseId: s.warehouseId,
            warehouseName: s.warehouse?.name || "Desconocida",
            currentStock: s.quantity,
            threshold: product.minStockThreshold,
            deficit: product.minStockThreshold - s.quantity
          }))
        }
      })
      .filter(Boolean)
    
    return NextResponse.json({ products: lowStockProducts })
  } catch (error: any) {
    console.error("Error obteniendo productos con stock bajo:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


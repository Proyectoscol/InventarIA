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

    const productId = params.id

    // Verificar que el producto existe y está eliminado
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    if (!product.deletedAt) {
      return NextResponse.json({ error: "El producto no está eliminado" }, { status: 400 })
    }

    // Restaurar producto (soft delete = null)
    const restored = await prisma.product.update({
      where: { id: productId },
      data: {
        deletedAt: null
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Producto restaurado exitosamente",
      product: restored
    })
  } catch (error: any) {
    console.error("Error restaurando producto:", error)
    return NextResponse.json(
      { error: error.message || "Error restaurando producto" },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import sharp from "sharp"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        stock: true,
        batches: {
          orderBy: { purchaseDate: "desc" },
          take: 1
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    console.error("Error obteniendo producto:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo producto" },
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
    const productId = params.id

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    // Preparar datos de actualización
    const updateData: any = {}

    // Si se envía nombre, actualizar también nameLower
    if (data.name !== undefined) {
      updateData.name = data.name.trim()
      updateData.nameLower = data.name.trim().toLowerCase()
    }

    if (data.description !== undefined) {
      updateData.description = data.description
    }

    if (data.minStockThreshold !== undefined) {
      updateData.minStockThreshold = data.minStockThreshold
    }

    // Comprimir imagen si se envía
    if (data.imageBase64 !== undefined) {
      if (data.imageBase64) {
        try {
          const base64Data = data.imageBase64.split(",")[1] || data.imageBase64
          const buffer = Buffer.from(base64Data, "base64")
          
          const compressedBuffer = await sharp(buffer)
            .resize(800, 800, {
              fit: "inside",
              withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toBuffer()
          
          if (compressedBuffer.length > 500 * 1024) {
            const superCompressed = await sharp(buffer)
              .resize(600, 600, {
                fit: "inside",
                withoutEnlargement: true
              })
              .jpeg({ quality: 60 })
              .toBuffer()
            
            updateData.imageBase64 = `data:image/jpeg;base64,${superCompressed.toString("base64")}`
          } else {
            updateData.imageBase64 = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`
          }
        } catch (imgError) {
          console.error("Error comprimiendo imagen:", imgError)
          // Si falla la compresión, usar la imagen original
          updateData.imageBase64 = data.imageBase64
        }
      } else {
        updateData.imageBase64 = null
      }
    }

    // Verificar unicidad del nombre si se está cambiando
    if (data.name && data.name.trim().toLowerCase() !== existingProduct.nameLower) {
      const nameLower = data.name.trim().toLowerCase()
      const duplicate = await prisma.product.findFirst({
        where: {
          companyId: existingProduct.companyId,
          nameLower: nameLower,
          id: { not: productId }
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "Ya existe un producto con ese nombre en esta compañía" },
          { status: 400 }
        )
      }
    }

    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData
    })

    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error("Error actualizando producto:", error)
    return NextResponse.json(
      { error: error.message || "Error actualizando producto" },
      { status: 500 }
    )
  }
}


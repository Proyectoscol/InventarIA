import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import sharp from "sharp"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()
    
    // Validar nombre único (solo productos activos)
    const nameLower = data.name.toLowerCase().trim()
    const existing = await prisma.product.findFirst({
      where: {
        companyId: data.companyId,
        nameLower,
        deletedAt: null // Solo productos activos
      }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un producto con ese nombre" },
        { status: 400 }
      )
    }
    
    // Comprimir imagen si existe
    let imageBase64 = null
    if (data.imageBase64) {
      try {
        // Remover prefijo data:image/...;base64,
        const base64Data = data.imageBase64.split(",")[1] || data.imageBase64
        const buffer = Buffer.from(base64Data, "base64")
        
        // Comprimir con Sharp
        const compressedBuffer = await sharp(buffer)
          .resize(800, 800, {
            fit: "inside",
            withoutEnlargement: true
          })
          .jpeg({ quality: 80 })
          .toBuffer()
        
        // Verificar tamaño (max 500KB)
        if (compressedBuffer.length > 500 * 1024) {
          // Comprimir más agresivamente
          const superCompressed = await sharp(buffer)
            .resize(600, 600, {
              fit: "inside",
              withoutEnlargement: true
            })
            .jpeg({ quality: 60 })
            .toBuffer()
          
          imageBase64 = `data:image/jpeg;base64,${superCompressed.toString("base64")}`
        } else {
          imageBase64 = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`
        }
      } catch (imgError) {
        console.error("Error comprimiendo imagen:", imgError)
        // Continuar sin imagen si falla
      }
    }
    
    // Crear producto
    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        nameLower,
        description: data.description,
        imageBase64,
        companyId: data.companyId,
        minStockThreshold: data.minStockThreshold || 10
      }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error("Error creando producto:", error)
    return NextResponse.json(
      { error: error.message || "Error creando producto" },
      { status: 500 }
    )
  }
}


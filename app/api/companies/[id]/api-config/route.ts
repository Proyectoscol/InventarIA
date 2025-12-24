import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { encrypt, decrypt, getLastChars } from "@/lib/encryption"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const apiConfig = await prisma.apiConfig.findUnique({
      where: { companyId: params.id }
    })

    if (!apiConfig || !apiConfig.openaiKey) {
      return NextResponse.json({
        configured: false,
        lastChars: null
      })
    }

    // Desencriptar para obtener los últimos caracteres
    try {
      const decryptedKey = decrypt(apiConfig.openaiKey)
      const lastChars = getLastChars(decryptedKey, 10)
      
      return NextResponse.json({
        configured: true,
        lastChars: lastChars
      })
    } catch (error) {
      // Si hay error al desencriptar, asumir que no está configurado
      console.error("Error desencriptando API Key:", error)
      return NextResponse.json({
        configured: false,
        lastChars: null
      })
    }
  } catch (error: any) {
    console.error("Error obteniendo configuración de API:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo configuración" },
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
    const { openaiKey } = data

    if (!openaiKey || typeof openaiKey !== "string" || openaiKey.trim().length === 0) {
      return NextResponse.json(
        { error: "API Key de OpenAI es requerida" },
        { status: 400 }
      )
    }

    // Encriptar la API Key antes de guardarla
    const encryptedKey = encrypt(openaiKey.trim())

    const apiConfig = await prisma.apiConfig.upsert({
      where: { companyId: params.id },
      update: {
        openaiKey: encryptedKey
      },
      create: {
        companyId: params.id,
        openaiKey: encryptedKey
      }
    })

    // Retornar solo los últimos caracteres para confirmación
    const lastChars = getLastChars(openaiKey.trim(), 10)

    return NextResponse.json({
      success: true,
      configured: true,
      lastChars: lastChars,
      message: "API Key de OpenAI guardada exitosamente"
    })
  } catch (error: any) {
    console.error("Error guardando configuración de API:", error)
    return NextResponse.json(
      { error: error.message || "Error guardando configuración" },
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

    await prisma.apiConfig.update({
      where: { companyId: params.id },
      data: {
        openaiKey: null
      }
    })

    return NextResponse.json({
      success: true,
      message: "API Key de OpenAI eliminada exitosamente"
    })
  } catch (error: any) {
    console.error("Error eliminando configuración de API:", error)
    return NextResponse.json(
      { error: error.message || "Error eliminando configuración" },
      { status: 500 }
    )
  }
}


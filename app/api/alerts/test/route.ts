import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendTestEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      )
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    const result = await sendTestEmail(email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        email: email,
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Error al enviar email"
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error en prueba de email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al enviar email de prueba"
      },
      { status: 500 }
    )
  }
}


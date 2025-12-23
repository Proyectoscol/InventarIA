import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCompanyUserEmails } from "@/lib/company-users"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const emails = await getCompanyUserEmails(params.id)

    return NextResponse.json({ emails })
  } catch (error: any) {
    console.error("Error obteniendo emails de usuarios:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo emails" },
      { status: 500 }
    )
  }
}


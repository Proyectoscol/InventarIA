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

    const companies = await prisma.company.findMany({
      where: {
        users: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        _count: {
          select: {
            products: true,
            warehouses: true
          }
        }
      }
    })

    return NextResponse.json(companies)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await req.json()

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.name
        }
      })

      await tx.userCompany.create({
        data: {
          userId: session.user.id,
          companyId: company.id,
          role: "admin"
        }
      })

      await tx.alertConfig.create({
        data: {
          companyId: company.id,
          alertEmails: data.alertEmails || [],
          enableAlerts: data.enableAlerts !== false
        }
      })

      return company
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}


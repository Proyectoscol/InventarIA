import { prisma } from "@/lib/prisma"

/**
 * Obtiene los emails de todos los usuarios asociados a una compañía
 * @param companyId ID de la compañía
 * @returns Array de emails de usuarios de la compañía
 */
export async function getCompanyUserEmails(companyId: string): Promise<string[]> {
  try {
    const userCompanies = await prisma.userCompany.findMany({
      where: {
        companyId: companyId
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    })

    // Extraer emails únicos
    const emails = userCompanies
      .map(uc => uc.user.email)
      .filter((email): email is string => email !== null && email !== undefined && email.trim() !== "")

    console.log(`📧 Encontrados ${emails.length} usuarios para la compañía ${companyId}:`, emails)
    return emails
  } catch (error: any) {
    console.error("❌ Error obteniendo emails de usuarios de la compañía:", error)
    return []
  }
}


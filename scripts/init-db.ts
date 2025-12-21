import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Verificando conexión a la base de datos...")
  
  try {
    // Verificar conexión
    await prisma.$connect()
    console.log("✅ Conexión a la base de datos exitosa")
    
    // Verificar si las tablas existen ejecutando una query simple
    const userCount = await prisma.user.count()
    console.log(`✅ Base de datos inicializada. Usuarios encontrados: ${userCount}`)
    
    // Si no hay usuarios, la base de datos está vacía pero las tablas existen
    if (userCount === 0) {
      console.log("ℹ️  Base de datos vacía. Las tablas están listas para usar.")
    }
    
  } catch (error: any) {
    console.error("❌ Error conectando a la base de datos:", error.message)
    
    // Si el error es que las tablas no existen, sugerir ejecutar migraciones
    if (error.message?.includes("does not exist") || error.message?.includes("relation")) {
      console.log("\n⚠️  Las tablas no existen. Ejecuta las migraciones:")
      console.log("   npx prisma migrate deploy")
      console.log("   o")
      console.log("   npx prisma db push")
    }
    
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


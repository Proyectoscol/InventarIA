import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDatabase() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...')
    
    // Intentar una consulta simple
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
    
    console.log('✅ Tablas encontradas en la base de datos:')
    console.log(JSON.stringify(result, null, 2))
    
    // Verificar tabla User específicamente
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Tabla User existe y tiene ${userCount} registros`)
    } catch (error: any) {
      console.log(`❌ Error accediendo a tabla User: ${error.message}`)
    }
    
  } catch (error: any) {
    console.error('❌ Error verificando base de datos:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabase()


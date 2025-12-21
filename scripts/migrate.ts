import { execSync } from "child_process"

console.log("🔄 Ejecutando migraciones de Prisma...")

try {
  // Generar cliente de Prisma
  console.log("📦 Generando cliente de Prisma...")
  execSync("npx prisma generate", { stdio: "inherit" })
  
  // Aplicar migraciones (para producción)
  console.log("🚀 Aplicando migraciones...")
  execSync("npx prisma migrate deploy", { stdio: "inherit" })
  
  // Alternativa: usar db push si no hay migraciones
  // execSync("npx prisma db push", { stdio: "inherit" })
  
  console.log("✅ Migraciones completadas exitosamente")
} catch (error) {
  console.error("❌ Error ejecutando migraciones:", error)
  process.exit(1)
}


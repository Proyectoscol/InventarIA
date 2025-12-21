#!/bin/sh
set -e

echo "🚀 Iniciando aplicación InventarIA..."

# Ejecutar migraciones o crear esquema
echo "🔄 Configurando base de datos de Prisma..."
# Usar Prisma desde node_modules (versión correcta)
if [ -f "./node_modules/.bin/prisma" ]; then
  PRISMA_CMD="./node_modules/.bin/prisma"
else
  PRISMA_CMD="npx -y prisma@5.19.0"
fi

# Intentar migraciones primero (solo si existen)
if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  echo "   Aplicando migraciones existentes..."
  $PRISMA_CMD migrate deploy || {
    echo "   ⚠️  Error aplicando migraciones, intentando db push..."
    $PRISMA_CMD db push --accept-data-loss --skip-generate || {
      echo "❌ Error configurando base de datos"
      exit 1
    }
  }
else
  echo "   No hay migraciones, creando esquema con db push..."
  $PRISMA_CMD db push --accept-data-loss --skip-generate || {
    echo "❌ Error creando esquema de base de datos"
    echo "   Verifica que DATABASE_URL esté configurada correctamente"
    exit 1
  }
  echo "   ✅ Esquema creado exitosamente"
fi

echo "✅ Base de datos lista"

# Iniciar servidor
echo "🌐 Iniciando servidor Next.js..."
exec node server.js


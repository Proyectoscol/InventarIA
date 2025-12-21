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

# Intentar migraciones primero
echo "   Intentando migraciones..."
$PRISMA_CMD migrate deploy 2>/dev/null || {
  echo "   No hay migraciones, creando esquema con db push..."
  $PRISMA_CMD db push --accept-data-loss --skip-generate || {
    echo "❌ Error creando esquema de base de datos"
    exit 1
  }
  echo "   ✅ Esquema creado exitosamente"
}

echo "✅ Base de datos lista"

# Iniciar servidor
echo "🌐 Iniciando servidor Next.js..."
exec node server.js


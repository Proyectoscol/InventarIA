#!/bin/sh
set -e

echo "🚀 Iniciando aplicación InventarIA..."

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy || {
  echo "⚠️  migrate deploy falló, intentando db push..."
  npx prisma db push --accept-data-loss || {
    echo "❌ Error ejecutando migraciones"
    exit 1
  }
}

echo "✅ Base de datos lista"

# Iniciar servidor
echo "🌐 Iniciando servidor Next.js..."
exec node server.js


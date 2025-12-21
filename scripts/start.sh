#!/bin/sh
set -e

echo "🚀 Iniciando aplicación InventarIA..."

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones de Prisma..."
# Usar Prisma desde node_modules si está disponible
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma migrate deploy || {
    echo "⚠️  migrate deploy falló, intentando db push..."
    ./node_modules/.bin/prisma db push --accept-data-loss || {
      echo "❌ Error ejecutando migraciones"
      exit 1
    }
  }
else
  npx prisma migrate deploy || {
    echo "⚠️  migrate deploy falló, intentando db push..."
    npx prisma db push --accept-data-loss || {
      echo "❌ Error ejecutando migraciones"
      exit 1
    }
  }
fi

echo "✅ Base de datos lista"

# Iniciar servidor
echo "🌐 Iniciando servidor Next.js..."
exec node server.js


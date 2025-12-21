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
  $PRISMA_CMD db push --accept-data-loss --skip-generate --force-reset || {
    echo "   ⚠️  db push falló, intentando sin force-reset..."
    $PRISMA_CMD db push --accept-data-loss --skip-generate || {
      echo "❌ Error creando esquema de base de datos"
      echo "   Verifica que DATABASE_URL esté configurada correctamente"
      echo "   DATABASE_URL actual: ${DATABASE_URL:0:50}..."
      exit 1
    }
  }
  
  # Verificar que las tablas se crearon
  echo "   Verificando que las tablas se crearon..."
  $PRISMA_CMD db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" || {
    echo "   ⚠️  No se pudieron verificar las tablas, pero continuando..."
  }
  
  echo "   ✅ Esquema creado exitosamente"
  
  # Verificar que las tablas existen
  echo "   Verificando tablas creadas..."
  if [ -f "./node_modules/.bin/tsx" ]; then
    ./node_modules/.bin/tsx scripts/verify-db.ts || echo "   ⚠️  No se pudo verificar, pero continuando..."
  fi
fi

echo "✅ Base de datos lista"

# Iniciar servidor
echo "🌐 Iniciando servidor Next.js..."
exec node server.js


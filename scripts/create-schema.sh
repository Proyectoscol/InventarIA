#!/bin/sh
# Script para forzar la creación del esquema de base de datos

PRISMA_CMD="./node_modules/.bin/prisma"
if [ ! -f "$PRISMA_CMD" ]; then
  PRISMA_CMD="npx -y prisma@5.19.0"
fi

echo "🔧 Forzando creación del esquema de base de datos..."

# Intentar db push con force-reset
echo "   Paso 1: Intentando db push con force-reset..."
$PRISMA_CMD db push --force-reset --accept-data-loss --skip-generate 2>&1

# Verificar tablas
echo "   Paso 2: Verificando tablas creadas..."
TABLES=$($PRISMA_CMD db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo "0")

if [ "$TABLES" = "0" ]; then
  echo "   ⚠️  No se encontraron tablas, intentando sin force-reset..."
  $PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1
  
  # Verificar nuevamente
  TABLES=$($PRISMA_CMD db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo "0")
fi

if [ "$TABLES" != "0" ] && [ -n "$TABLES" ]; then
  echo "   ✅ Se encontraron $TABLES tablas"
  echo "   Listando tablas:"
  $PRISMA_CMD db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;" 2>/dev/null || true
else
  echo "   ❌ No se pudieron crear las tablas"
  echo "   Verifica:"
  echo "   1. DATABASE_URL está configurada correctamente"
  echo "   2. El usuario de la base de datos tiene permisos CREATE TABLE"
  echo "   3. La base de datos existe y es accesible"
  exit 1
fi


#!/bin/sh
# Script para verificar que todas las tablas estén creadas

set -e

if [ -z "$DATABASE_URL" ]; then
  if [ -n "$POSTGRES_HOST" ]; then
    export DATABASE_URL="postgres://${POSTGRES_USERNAME:-postgres}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT:-5432}/${POSTGRES_DATABASE}?sslmode=disable"
  else
    echo "❌ DATABASE_URL no está definida"
    exit 1
  fi
fi

PRISMA_CMD="./node_modules/.bin/prisma"
if [ ! -f "$PRISMA_CMD" ]; then
  PRISMA_CMD="npx -y prisma@5.19.0"
fi

echo "🔍 Verificando tablas en la base de datos..."
PULL_OUTPUT=$(DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db pull --print 2>&1 | head -100)

EXPECTED_MODELS="User Company UserCompany AlertConfig Warehouse Product Stock Batch Customer Movement"
EXPECTED_COUNT=10

TABLES=$(echo "$PULL_OUTPUT" | grep -c "^model " || echo "0")

echo ""
echo "📊 Resumen:"
echo "   Tablas encontradas: $TABLES de $EXPECTED_COUNT esperadas"
echo ""

ALL_PRESENT=true
for model in $EXPECTED_MODELS; do
  if echo "$PULL_OUTPUT" | grep -q "model $model"; then
    echo "   ✅ $model"
  else
    echo "   ❌ $model (FALTA)"
    ALL_PRESENT=false
  fi
done

echo ""
if [ "$ALL_PRESENT" = "true" ] && [ "$TABLES" -eq "$EXPECTED_COUNT" ]; then
  echo "✅ Todas las tablas están presentes"
  exit 0
else
  echo "❌ Faltan tablas. Ejecuta: DATABASE_URL=\"\$DATABASE_URL\" $PRISMA_CMD db push --force-reset --accept-data-loss"
  exit 1
fi


#!/bin/sh
# Script para forzar la creación de todas las tablas usando SQL directo
# Esto es un workaround cuando Prisma db push no crea todas las tablas

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

echo "🔧 Forzando creación de tablas faltantes usando Prisma migrate..."

# Intentar usar migrate dev para crear todas las tablas
echo "   Paso 1: Creando migración inicial..."
DATABASE_URL="$DATABASE_URL" $PRISMA_CMD migrate dev --name init --create-only --skip-seed 2>&1 || {
  echo "   ⚠️  No se pudo crear migración, intentando db push con más opciones..."
  
  # Intentar db push con más verbosidad
  echo "   Paso 2: Ejecutando db push con opciones adicionales..."
  DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db push --accept-data-loss --skip-generate --force-reset 2>&1
  
  # Esperar un momento
  sleep 2
  
  # Verificar nuevamente
  echo "   Paso 3: Verificando tablas después de force-reset..."
  PULL_OUTPUT=$(DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db pull --print 2>&1 | head -100)
  
  TABLES=$(echo "$PULL_OUTPUT" | grep -c "^model " || echo "0")
  echo "   Tablas encontradas: $TABLES de 10 esperadas"
  
  if [ "$TABLES" -lt 10 ]; then
    echo "   ⚠️  Todavía faltan tablas. Esto puede ser un problema de permisos."
    echo "   Ejecuta los comandos GRANT del archivo FIX-PERMISSIONS.sql en tu base de datos."
  fi
}

echo "✅ Proceso completado"


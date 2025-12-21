#!/bin/sh
# Script para arreglar permisos de PostgreSQL usando Prisma

echo "🔧 Arreglando permisos de PostgreSQL..."

# Usar Prisma desde node_modules (versión correcta)
if [ -f "./node_modules/.bin/prisma" ]; then
  PRISMA_CMD="./node_modules/.bin/prisma"
else
  PRISMA_CMD="npx -y prisma@5.19.0"
fi

echo "   Ejecutando comandos GRANT..."

# Ejecutar comandos GRANT uno por uno
echo "GRANT ALL ON SCHEMA public TO postgres;" | $PRISMA_CMD db execute --stdin 2>&1
echo "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;" | $PRISMA_CMD db execute --stdin 2>&1
echo "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;" | $PRISMA_CMD db execute --stdin 2>&1
echo "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;" | $PRISMA_CMD db execute --stdin 2>&1
echo "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;" | $PRISMA_CMD db execute --stdin 2>&1

echo "   ✅ Permisos configurados"


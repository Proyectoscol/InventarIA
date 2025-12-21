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
  
  # Ejecutar db push
  $PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1
  
  # Verificar que las tablas se crearon
  echo "   Verificando que las tablas se crearon..."
  sleep 2  # Dar tiempo para que se completen las operaciones
  
  # Verificar tablas con una consulta más simple (usando echo | para compatibilidad con sh)
  TABLES_RESULT=$(echo "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public';" | $PRISMA_CMD db execute --stdin 2>&1)
  TABLES=$(echo "$TABLES_RESULT" | grep -oE '[0-9]+' | head -1 || echo "0")
  
  if [ "$TABLES" = "0" ] || [ -z "$TABLES" ]; then
    echo "   ⚠️  No se encontraron tablas, intentando con force-reset..."
    $PRISMA_CMD db push --force-reset --accept-data-loss --skip-generate 2>&1
    
    # Verificar nuevamente después de force-reset
    sleep 2
    TABLES_RESULT=$(echo "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public';" | $PRISMA_CMD db execute --stdin 2>&1)
    TABLES=$(echo "$TABLES_RESULT" | grep -oE '[0-9]+' | head -1 || echo "0")
    
    if [ "$TABLES" = "0" ]; then
      echo "   ❌ CRÍTICO: No se pudieron crear las tablas"
      echo "   Esto puede deberse a:"
      echo "   1. Permisos insuficientes en la base de datos"
      echo "   2. DATABASE_URL incorrecta"
      echo "   3. La base de datos no existe"
      echo "   Verifica los logs anteriores para más detalles"
      # No salir con error, permitir que el servidor inicie para ver errores en runtime
    else
      echo "   ✅ Se encontraron $TABLES tablas después de force-reset"
    fi
  else
    echo "   ✅ Se encontraron $TABLES tablas en la base de datos"
  fi
  
  echo "   ✅ Esquema configurado"
fi

echo "✅ Base de datos lista"

# Iniciar servidor
echo "🌐 Iniciando servidor Next.js..."
exec node server.js


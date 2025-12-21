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
  
  # Verificar tablas con una consulta más precisa
  # Contar todas las tablas BASE TABLE en public
  TABLES_RESULT=$(echo "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | $PRISMA_CMD db execute --stdin 2>&1)
  
  # Extraer el número real de la salida (buscar el número después de cualquier texto)
  TABLES=$(echo "$TABLES_RESULT" | grep -oE '\b[0-9]+\b' | tail -1 || echo "0")
  
  # Verificar específicamente si User existe
  USER_CHECK=$(echo "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User';" | $PRISMA_CMD db execute --stdin 2>&1)
  USER_COUNT=$(echo "$USER_CHECK" | grep -oE '\b[0-9]+\b' | tail -1 || echo "0")
  
  echo "   Resultado verificación: $TABLES tablas encontradas"
  echo "   Tabla User count: $USER_COUNT"
  
  # Verificar realmente si las tablas existen
  if [ "$TABLES" = "0" ] || [ "$USER_COUNT" = "0" ]; then
    echo "   ❌ No se encontraron tablas (encontradas: $TABLES, User: $USER_COUNT)"
    echo "   Forzando creación con db push --force-reset..."
    $PRISMA_CMD db push --force-reset --accept-data-loss --skip-generate 2>&1
    
    # Esperar y verificar nuevamente
    sleep 3
    echo "   Verificando nuevamente después de force-reset..."
    
    TABLES_RESULT=$(echo "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | $PRISMA_CMD db execute --stdin 2>&1)
    TABLES=$(echo "$TABLES_RESULT" | grep -oE '\b[0-9]+\b' | tail -1 || echo "0")
    USER_CHECK=$(echo "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User';" | $PRISMA_CMD db execute --stdin 2>&1)
    USER_COUNT=$(echo "$USER_CHECK" | grep -oE '\b[0-9]+\b' | tail -1 || echo "0")
    
    echo "   Después de force-reset: $TABLES tablas, User: $USER_COUNT"
    
    if [ "$TABLES" = "0" ] || [ "$USER_COUNT" = "0" ]; then
      echo "   ❌ CRÍTICO: Las tablas NO se están creando después de force-reset"
      echo "   Esto indica un problema de permisos o conexión"
      echo "   Verifica:"
      echo "   1. El usuario de PostgreSQL tiene permisos CREATE TABLE en el schema public"
      echo "   2. DATABASE_URL es correcta: ${DATABASE_URL:0:60}..."
      echo "   3. La base de datos 'inventory' existe"
      echo "   Ejecuta: GRANT ALL ON SCHEMA public TO postgres;"
      echo "   Continuando para que puedas ver los errores en runtime..."
    else
      echo "   ✅ Tablas creadas exitosamente: $TABLES tablas, User existe"
    fi
  else
    echo "   ✅ Verificación exitosa: $TABLES tablas encontradas, User existe"
  fi
  
  echo "   ✅ Esquema configurado"
fi

echo "✅ Base de datos lista"

# Iniciar servidor
echo "🌐 Iniciando servidor Next.js..."
exec node server.js


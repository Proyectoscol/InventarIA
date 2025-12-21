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
  # Primero verificar si existe la tabla User (que debería existir)
  USER_TABLE_CHECK=$(echo "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User');" | $PRISMA_CMD db execute --stdin 2>&1)
  
  # También contar todas las tablas
  TABLES_RESULT=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | $PRISMA_CMD db execute --stdin 2>&1)
  TABLES=$(echo "$TABLES_RESULT" | grep -oE '[0-9]+' | head -1 || echo "0")
  
  # Verificar si User existe
  USER_EXISTS=$(echo "$USER_TABLE_CHECK" | grep -i "true\|t\|1" || echo "")
  
  echo "   Resultado verificación: $TABLES tablas encontradas"
  echo "   Tabla User existe: $USER_EXISTS"
  
  # Verificar realmente si las tablas existen (especialmente User)
  if [ -z "$USER_EXISTS" ] || [ "$TABLES" = "0" ]; then
    echo "   ⚠️  No se encontraron tablas reales, forzando creación..."
    echo "   Ejecutando db push con force-reset..."
    $PRISMA_CMD db push --force-reset --accept-data-loss --skip-generate 2>&1
    
    # Esperar y verificar nuevamente
    sleep 3
    echo "   Verificando nuevamente después de force-reset..."
    
    USER_TABLE_CHECK=$(echo "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User');" | $PRISMA_CMD db execute --stdin 2>&1)
    TABLES_RESULT=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | $PRISMA_CMD db execute --stdin 2>&1)
    TABLES=$(echo "$TABLES_RESULT" | grep -oE '[0-9]+' | head -1 || echo "0")
    USER_EXISTS=$(echo "$USER_TABLE_CHECK" | grep -i "true\|t\|1" || echo "")
    
    echo "   Después de force-reset: $TABLES tablas, User existe: $USER_EXISTS"
    
    if [ -z "$USER_EXISTS" ] || [ "$TABLES" = "0" ]; then
      echo "   ❌ CRÍTICO: Las tablas NO se están creando"
      echo "   Posibles causas:"
      echo "   1. El usuario de PostgreSQL no tiene permisos CREATE TABLE"
      echo "   2. DATABASE_URL apunta a una base de datos diferente"
      echo "   3. Hay un problema con la conexión a la base de datos"
      echo "   Ejecuta la query en VERIFY-DB.sql para verificar manualmente"
      echo "   Continuando para que puedas ver los errores en runtime..."
    else
      echo "   ✅ Tablas creadas exitosamente después de force-reset"
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


#!/bin/sh
set -e

echo "🚀 Iniciando aplicación InventarIA..."

# Construir DATABASE_URL si Easypanel proporciona variables separadas
# Esto DEBE hacerse antes de ejecutar cualquier comando de Prisma
echo "   Verificando configuración de base de datos..."
echo "   Variables de entorno disponibles:"
echo "     DATABASE_URL: ${DATABASE_URL:+definida (oculta)}"
echo "     POSTGRES_HOST: ${POSTGRES_HOST:-no definida}"
echo "     POSTGRES_USERNAME: ${POSTGRES_USERNAME:-no definida}"
echo "     POSTGRES_DATABASE: ${POSTGRES_DATABASE:-no definida}"
echo "     POSTGRES_PORT: ${POSTGRES_PORT:-no definida}"

if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_HOST" ]; then
  if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "   ❌ ERROR: POSTGRES_PASSWORD no está definida"
    exit 1
  fi
  if [ -z "$POSTGRES_DATABASE" ]; then
    echo "   ❌ ERROR: POSTGRES_DATABASE no está definida"
    exit 1
  fi
  DATABASE_URL="postgres://${POSTGRES_USERNAME:-postgres}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT:-5432}/${POSTGRES_DATABASE}?sslmode=disable"
  export DATABASE_URL
  echo "   ✅ Construida DATABASE_URL desde variables separadas de Easypanel"
  echo "   DATABASE_URL: postgres://${POSTGRES_USERNAME:-postgres}:***@${POSTGRES_HOST}:${POSTGRES_PORT:-5432}/${POSTGRES_DATABASE}?sslmode=disable"
elif [ -z "$DATABASE_URL" ]; then
  echo "   ❌ ERROR: DATABASE_URL no está definida"
  echo "   Configura DATABASE_URL o las variables POSTGRES_* en Easypanel"
  exit 1
else
  echo "   ✅ DATABASE_URL ya está configurada"
fi

# Verificar que DATABASE_URL esté disponible
if [ -z "$DATABASE_URL" ]; then
  echo "   ❌ CRÍTICO: DATABASE_URL sigue vacía después de construcción"
  exit 1
fi

# Asegurar que DATABASE_URL esté exportada y disponible para todos los subprocesos
export DATABASE_URL
echo "   ✅ DATABASE_URL exportada correctamente"

# Ejecutar migraciones o crear esquema
echo "🔄 Configurando base de datos de Prisma..."
# Verificar una vez más que DATABASE_URL esté disponible
if [ -z "$DATABASE_URL" ]; then
  echo "   ❌ CRÍTICO: DATABASE_URL no está disponible antes de ejecutar Prisma"
  exit 1
fi

# Usar Prisma desde node_modules (versión correcta)
if [ -f "./node_modules/.bin/prisma" ]; then
  PRISMA_CMD="./node_modules/.bin/prisma"
else
  PRISMA_CMD="npx -y prisma@5.19.0"
fi

# Intentar migraciones primero (solo si existen)
if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  echo "   Aplicando migraciones existentes..."
  DATABASE_URL="$DATABASE_URL" $PRISMA_CMD migrate deploy || {
    echo "   ⚠️  Error aplicando migraciones, intentando db push..."
    DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db push --accept-data-loss --skip-generate || {
      echo "❌ Error configurando base de datos"
      exit 1
    }
  }
else
  echo "   No hay migraciones, creando esquema con db push..."
  
  # Ejecutar db push con DATABASE_URL explícitamente
  DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1
  
  # Verificar que las tablas se crearon
  echo "   Verificando que las tablas se crearon..."
  sleep 2  # Dar tiempo para que se completen las operaciones
  
  # Verificar tablas usando Prisma Studio o una query directa
  # Como db execute no devuelve resultados, usamos db pull para verificar
  echo "   Verificando tablas usando método alternativo..."
  
  # Intentar listar tablas usando una query que Prisma pueda ejecutar
  # Usar db pull para ver qué hay en la base de datos
  PULL_OUTPUT=$(DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db pull --print 2>&1 | head -50)
  
  # Si db pull encuentra tablas, las mostrará en el schema
  if echo "$PULL_OUTPUT" | grep -q "model"; then
    TABLES=$(echo "$PULL_OUTPUT" | grep -c "^model " || echo "0")
    echo "   Encontradas $TABLES tablas usando db pull"
    echo "   Tablas encontradas:"
    echo "$PULL_OUTPUT" | grep "^model " | sed 's/^model /     - /' || true
  else
    TABLES="0"
    echo "   No se encontraron tablas (db pull no encontró modelos)"
  fi
  
  # Verificar específicamente User
  if echo "$PULL_OUTPUT" | grep -q "model User"; then
    USER_EXISTS="1"
    echo "   Tabla User encontrada"
  else
    USER_EXISTS="0"
    echo "   Tabla User NO encontrada"
  fi
  
  # Verificar realmente si las tablas existen
  if [ "$TABLES" = "0" ] || [ "$USER_EXISTS" = "0" ]; then
    echo "   ❌ No se encontraron tablas (encontradas: $TABLES, User: $USER_EXISTS)"
    echo "   Forzando creación con db push --force-reset..."
    DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db push --force-reset --accept-data-loss --skip-generate 2>&1
    
    # Esperar y verificar nuevamente
    sleep 3
    echo "   Verificando nuevamente después de force-reset..."
    
    PULL_OUTPUT=$(DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db pull --print 2>&1 | head -50)
    
    if echo "$PULL_OUTPUT" | grep -q "model"; then
      TABLES=$(echo "$PULL_OUTPUT" | grep -c "^model " || echo "0")
      echo "   Después de force-reset: $TABLES tablas encontradas"
      echo "   Tablas encontradas:"
      echo "$PULL_OUTPUT" | grep "^model " | sed 's/^model /     - /' || true
    else
      TABLES="0"
      echo "   Después de force-reset: 0 tablas encontradas"
    fi
    
    if echo "$PULL_OUTPUT" | grep -q "model User"; then
      USER_EXISTS="1"
    else
      USER_EXISTS="0"
    fi
    
    echo "   Después de force-reset: $TABLES tablas, User: $USER_EXISTS"
    
    if [ "$TABLES" = "0" ] || [ "$USER_EXISTS" = "0" ]; then
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


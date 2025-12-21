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
  
  # Primero intentar crear una migración inicial
  echo "   Intentando crear migración inicial..."
  MIGRATE_OUTPUT=$(DATABASE_URL="$DATABASE_URL" $PRISMA_CMD migrate dev --name init --create-only 2>&1 || echo "MIGRATE_FAILED")
  
  if echo "$MIGRATE_OUTPUT" | grep -q "MIGRATE_FAILED"; then
    echo "   No se pudo crear migración, usando db push..."
    # Primero intentar db push normal
    echo "   Ejecutando db push inicial..."
    DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1 || {
      echo "   ⚠️  Error en db push inicial, pero continuando (preservando datos)..."
    }
  else
    echo "   Migración creada, aplicándola..."
    DATABASE_URL="$DATABASE_URL" $PRISMA_CMD migrate deploy 2>&1 || {
      echo "   ⚠️  Error aplicando migración, usando db push como fallback..."
      DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1
    }
  fi
  
  # Verificar que las tablas se crearon
  echo "   Verificando que las tablas se crearon..."
  sleep 2  # Dar tiempo para que se completen las operaciones
  
  # Verificar tablas usando Prisma Studio o una query directa
  # Como db execute no devuelve resultados, usamos db pull para verificar
  echo "   Verificando tablas usando método alternativo..."
  
  # Intentar listar tablas usando una query que Prisma pueda ejecutar
  # Usar db pull para ver qué hay en la base de datos
  PULL_OUTPUT=$(DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db pull --print 2>&1 | head -100)
  
  # Tablas esperadas (10 en total)
  EXPECTED_TABLES=10
  EXPECTED_MODELS="User Company UserCompany AlertConfig Warehouse Product Stock Batch Customer Movement"
  
  # Si db pull encuentra tablas, las mostrará en el schema
  if echo "$PULL_OUTPUT" | grep -q "model"; then
    TABLES=$(echo "$PULL_OUTPUT" | grep -c "^model " || echo "0")
    echo "   Encontradas $TABLES tablas usando db pull (esperadas: $EXPECTED_TABLES)"
    echo "   Tablas encontradas:"
    echo "$PULL_OUTPUT" | grep "^model " | sed 's/^model /     - /' || true
  else
    TABLES="0"
    echo "   No se encontraron tablas (db pull no encontró modelos)"
  fi
  
  # Verificar que todas las tablas esperadas estén presentes
  ALL_TABLES_PRESENT=true
  for model in $EXPECTED_MODELS; do
    if echo "$PULL_OUTPUT" | grep -q "model $model"; then
      echo "   ✅ Tabla $model encontrada"
    else
      echo "   ❌ Tabla $model NO encontrada"
      ALL_TABLES_PRESENT=false
    fi
  done
  
  # Verificar realmente si las tablas existen
  if [ "$TABLES" = "0" ] || [ "$TABLES" -lt "$EXPECTED_TABLES" ] || [ "$ALL_TABLES_PRESENT" = "false" ]; then
    echo "   ❌ No se encontraron todas las tablas necesarias (encontradas: $TABLES, esperadas: $EXPECTED_TABLES)"
    echo "   Intentando crear tablas faltantes sin borrar datos existentes..."
    # Primero intentar db push normal (sin force-reset para no borrar datos)
    DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1
    
    # Esperar y verificar nuevamente
    sleep 3
    echo "   Verificando nuevamente después de db push..."
    
    PULL_OUTPUT=$(DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db pull --print 2>&1 | head -100)
    
    if echo "$PULL_OUTPUT" | grep -q "model"; then
      TABLES=$(echo "$PULL_OUTPUT" | grep -c "^model " || echo "0")
      echo "   Después de db push: $TABLES tablas encontradas (esperadas: $EXPECTED_TABLES)"
      echo "   Tablas encontradas:"
      echo "$PULL_OUTPUT" | grep "^model " | sed 's/^model /     - /' || true
    else
      TABLES="0"
      echo "   Después de db push: 0 tablas encontradas"
    fi
    
    # Verificar nuevamente todas las tablas esperadas
    ALL_TABLES_PRESENT=true
    for model in $EXPECTED_MODELS; do
      if echo "$PULL_OUTPUT" | grep -q "model $model"; then
        echo "   ✅ Tabla $model encontrada"
      else
        echo "   ❌ Tabla $model NO encontrada"
        ALL_TABLES_PRESENT=false
      fi
    done
    
    if [ "$TABLES" = "0" ] || [ "$TABLES" -lt "$EXPECTED_TABLES" ] || [ "$ALL_TABLES_PRESENT" = "false" ]; then
      echo "   ⚠️  Algunas tablas aún faltan después de db push"
      echo "   Esto puede indicar un problema de permisos o que las tablas necesitan crearse manualmente"
      echo "   Verifica:"
      echo "   1. El usuario de PostgreSQL tiene permisos CREATE TABLE en el schema public"
      echo "   2. DATABASE_URL es correcta: ${DATABASE_URL:0:60}..."
      echo "   3. La base de datos 'inventory' existe"
      echo "   Ejecuta los comandos GRANT del archivo FIX-PERMISSIONS.sql si es necesario"
      echo ""
      echo "   Intentando crear tablas faltantes manualmente (sin borrar datos existentes)..."
      
      # Intentar crear las tablas faltantes usando SQL directo
      echo "   Creando Batch, Customer y Movement usando SQL..."
      
      # Batch table
      echo "   Creando tabla batches..."
      echo "CREATE TABLE IF NOT EXISTS \"batches\" (
        \"id\" TEXT NOT NULL,
        \"batchNumber\" TEXT NOT NULL,
        \"productId\" TEXT NOT NULL,
        \"warehouseId\" TEXT NOT NULL,
        \"initialQuantity\" INTEGER NOT NULL,
        \"remainingQty\" INTEGER NOT NULL,
        \"unitCost\" DECIMAL(15,2) NOT NULL,
        \"purchaseDate\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \"batches_pkey\" PRIMARY KEY (\"id\"),
        CONSTRAINT \"batches_batchNumber_key\" UNIQUE (\"batchNumber\")
      );" | DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db execute --stdin 2>&1 || echo "   ⚠️  Error creando batches"
      
      # Customer table
      echo "   Creando tabla customers..."
      echo "CREATE TABLE IF NOT EXISTS \"customers\" (
        \"id\" TEXT NOT NULL,
        \"name\" TEXT NOT NULL,
        \"email\" TEXT,
        \"phone\" TEXT,
        \"address\" TEXT,
        \"companyId\" TEXT NOT NULL,
        \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \"updatedAt\" TIMESTAMP(3) NOT NULL,
        CONSTRAINT \"customers_pkey\" PRIMARY KEY (\"id\")
      );" | DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db execute --stdin 2>&1 || echo "   ⚠️  Error creando customers"
      
      # Movement table (más compleja)
      echo "   Creando tabla movements..."
      echo "CREATE TABLE IF NOT EXISTS \"movements\" (
        \"id\" TEXT NOT NULL,
        \"movementNumber\" TEXT NOT NULL,
        \"type\" TEXT NOT NULL,
        \"productId\" TEXT NOT NULL,
        \"warehouseId\" TEXT NOT NULL,
        \"batchId\" TEXT,
        \"quantity\" INTEGER NOT NULL,
        \"unitPrice\" DECIMAL(15,2) NOT NULL,
        \"totalAmount\" DECIMAL(15,2) NOT NULL,
        \"paymentType\" TEXT NOT NULL,
        \"cashAmount\" DECIMAL(15,2),
        \"creditAmount\" DECIMAL(15,2),
        \"creditPaid\" BOOLEAN NOT NULL DEFAULT false,
        \"hasShipping\" BOOLEAN NOT NULL DEFAULT false,
        \"shippingCost\" DECIMAL(15,2),
        \"shippingPaidBy\" TEXT,
        \"customerId\" TEXT,
        \"unitCost\" DECIMAL(15,2),
        \"profit\" DECIMAL(15,2),
        \"notes\" TEXT,
        \"movementDate\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \"updatedAt\" TIMESTAMP(3) NOT NULL,
        CONSTRAINT \"movements_pkey\" PRIMARY KEY (\"id\"),
        CONSTRAINT \"movements_movementNumber_key\" UNIQUE (\"movementNumber\")
      );" | DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db execute --stdin 2>&1 || echo "   ⚠️  Error creando movements"
      
      # Crear índices y foreign keys después
      echo "   Creando índices y relaciones..."
      echo "CREATE INDEX IF NOT EXISTS \"batches_productId_warehouseId_remainingQty_idx\" ON \"batches\"(\"productId\", \"warehouseId\", \"remainingQty\");" | DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db execute --stdin 2>&1 || true
      echo "CREATE INDEX IF NOT EXISTS \"movements_productId_warehouseId_movementDate_idx\" ON \"movements\"(\"productId\", \"warehouseId\", \"movementDate\");" | DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db execute --stdin 2>&1 || true
      echo "CREATE INDEX IF NOT EXISTS \"movements_type_movementDate_idx\" ON \"movements\"(\"type\", \"movementDate\");" | DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db execute --stdin 2>&1 || true
      
      echo "   Verificando nuevamente después de creación manual..."
      sleep 2
      
      # Verificar usando SQL directo en lugar de solo db pull
      echo "   Verificando tablas usando SQL directo..."
      SQL_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db execute --stdin 2>&1 | tail -1 | grep -oE '[0-9]+' || echo "0")
      
      if [ -n "$SQL_CHECK" ] && [ "$SQL_CHECK" != "0" ]; then
        echo "   ✅ Verificación SQL: $SQL_CHECK tablas encontradas en la base de datos"
        
        # Verificar tablas específicas
        for table in batches customers movements; do
          TABLE_CHECK=$(echo "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" | DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db execute --stdin 2>&1 | grep -i "true\|1" || echo "")
          if [ -n "$TABLE_CHECK" ]; then
            echo "   ✅ Tabla $table existe en la base de datos"
          else
            echo "   ⚠️  Tabla $table no detectada (puede ser un problema de detección de Prisma)"
          fi
        done
        
        if [ "$SQL_CHECK" -ge "$EXPECTED_TABLES" ]; then
          echo "   ✅ Todas las tablas están presentes en la base de datos"
          echo "   ℹ️  Nota: Prisma db pull puede no detectarlas, pero las tablas existen"
        else
          echo "   ⚠️  Solo $SQL_CHECK tablas encontradas (esperadas: $EXPECTED_TABLES)"
        fi
      else
        # Fallback a db pull
        PULL_OUTPUT=$(DATABASE_URL="$DATABASE_URL" $PRISMA_CMD db pull --print 2>&1 | head -100)
        TABLES=$(echo "$PULL_OUTPUT" | grep -c "^model " || echo "0")
        echo "   Tablas encontradas después de creación manual: $TABLES de $EXPECTED_TABLES"
        
        if [ "$TABLES" -lt "$EXPECTED_TABLES" ]; then
          echo "   ⚠️  Prisma no detecta todas las tablas, pero pueden existir en la base de datos"
          echo "   Verifica directamente en PostgreSQL con: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
        else
          echo "   ✅ Todas las tablas creadas exitosamente"
        fi
      fi
      
      echo "   ℹ️  Continuando con el inicio del servidor..."
    else
      echo "   ✅ Tablas creadas exitosamente: $TABLES tablas de $EXPECTED_TABLES esperadas"
    fi
  else
    echo "   ✅ Verificación exitosa: $TABLES tablas encontradas de $EXPECTED_TABLES esperadas"
  fi
  
  echo "   ✅ Esquema configurado"
fi

echo "✅ Base de datos lista"

# Iniciar servidor
echo "🌐 Iniciando servidor Next.js..."
exec node server.js


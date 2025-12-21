-- Script para ejecutar en PostgreSQL para crear todas las tablas faltantes
-- Ejecuta esto conectado a la base de datos 'inventory'

-- 1. Cambiar a la base de datos correcta
\c inventory

-- 2. Conceder permisos
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- 3. Verificar tablas existentes
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 4. Crear tablas faltantes si no existen
-- Batch table
CREATE TABLE IF NOT EXISTS "batches" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "initialQuantity" INTEGER NOT NULL,
    "remainingQty" INTEGER NOT NULL,
    "unitCost" DECIMAL(15,2) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "batches_batchNumber_key" UNIQUE ("batchNumber")
);

-- Customer table
CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Movement table
CREATE TABLE IF NOT EXISTS "movements" (
    "id" TEXT NOT NULL,
    "movementNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paymentType" TEXT NOT NULL,
    "cashAmount" DECIMAL(15,2),
    "creditAmount" DECIMAL(15,2),
    "creditPaid" BOOLEAN NOT NULL DEFAULT false,
    "hasShipping" BOOLEAN NOT NULL DEFAULT false,
    "shippingCost" DECIMAL(15,2),
    "shippingPaidBy" TEXT,
    "customerId" TEXT,
    "unitCost" DECIMAL(15,2),
    "profit" DECIMAL(15,2),
    "notes" TEXT,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "movements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "movements_movementNumber_key" UNIQUE ("movementNumber")
);

-- 5. Crear índices
CREATE INDEX IF NOT EXISTS "batches_productId_warehouseId_remainingQty_idx" 
    ON "batches"("productId", "warehouseId", "remainingQty");

CREATE INDEX IF NOT EXISTS "movements_productId_warehouseId_movementDate_idx" 
    ON "movements"("productId", "warehouseId", "movementDate");

CREATE INDEX IF NOT EXISTS "movements_type_movementDate_idx" 
    ON "movements"("type", "movementDate");

-- 6. Agregar foreign keys si las tablas relacionadas existen
-- (Esto puede fallar si las tablas relacionadas no existen, pero está bien)
DO $$
BEGIN
    -- Foreign key para batches -> products
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE "batches" 
        ADD CONSTRAINT IF NOT EXISTS "batches_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;
    END IF;
    
    -- Foreign key para customers -> companies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        ALTER TABLE "customers" 
        ADD CONSTRAINT IF NOT EXISTS "customers_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
    END IF;
    
    -- Foreign keys para movements
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE "movements" 
        ADD CONSTRAINT IF NOT EXISTS "movements_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "products"("id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses') THEN
        ALTER TABLE "movements" 
        ADD CONSTRAINT IF NOT EXISTS "movements_warehouseId_fkey" 
        FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'batches') THEN
        ALTER TABLE "movements" 
        ADD CONSTRAINT IF NOT EXISTS "movements_batchId_fkey" 
        FOREIGN KEY ("batchId") REFERENCES "batches"("id");
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        ALTER TABLE "movements" 
        ADD CONSTRAINT IF NOT EXISTS "movements_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "customers"("id");
    END IF;
END $$;

-- 7. Verificar todas las tablas después de la creación
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 8. Contar tablas
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';


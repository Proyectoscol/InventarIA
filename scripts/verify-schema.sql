-- Script para verificar que el schema de movements esté correcto
-- Ejecutar en pgweb o psql

-- Verificar estructura de la tabla movements
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'movements'
ORDER BY ordinal_position;

-- Verificar que creditDays existe
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'movements'
  AND column_name = 'creditDays';

-- Verificar algunos registros recientes
SELECT 
    id,
    "movementNumber",
    type,
    "paymentType",
    "cashAmount",
    "creditAmount",
    "creditDays",
    "creditPaid",
    "totalAmount"
FROM movements
ORDER BY "createdAt" DESC
LIMIT 5;


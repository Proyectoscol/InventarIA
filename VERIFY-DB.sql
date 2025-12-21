-- Query para verificar tablas en PostgreSQL
-- Ejecuta esto directamente en tu base de datos PostgreSQL

-- 1. Ver todas las tablas en el schema public
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Contar tablas
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 3. Ver todos los schemas
SELECT schema_name 
FROM information_schema.schemata;

-- 4. Verificar si existe la tabla User específicamente
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'User'
) as user_table_exists;

-- 5. Ver todas las tablas en todos los schemas (por si están en otro schema)
SELECT 
    table_schema,
    table_name
FROM information_schema.tables 
WHERE table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;


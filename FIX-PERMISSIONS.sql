-- Script para arreglar permisos en PostgreSQL
-- Ejecuta esto como superusuario (postgres) en tu base de datos

-- 1. Conceder todos los permisos al usuario postgres en el schema public
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 2. Asegurar que el schema public es el predeterminado
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- 3. Verificar permisos actuales
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public';

-- 4. Si el usuario es diferente a 'postgres', reemplaza 'postgres' con tu usuario
-- Por ejemplo, si tu usuario es 'inventory_user':
-- GRANT ALL ON SCHEMA public TO inventory_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_user;


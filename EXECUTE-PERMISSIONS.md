# 🔧 Cómo Ejecutar el Script de Permisos

## Opción 1: Desde el Contenedor de PostgreSQL (Recomendado)

Si estás dentro del contenedor de PostgreSQL o tienes acceso a `psql`:

```bash
# Conectarte a PostgreSQL
psql -U postgres -d inventory

# O si estás en el contenedor de la base de datos:
psql postgresql://postgres:eb29c8713fca7d18fa93@localhost:5432/inventory
```

Una vez conectado, ejecuta:

```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
```

## Opción 2: Desde Easypanel (pgweb)

1. Ve a la interfaz de pgweb en Easypanel
2. Abre la pestaña "Query"
3. Pega y ejecuta estos comandos:

```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
```

## Opción 3: Desde el Contenedor de la Aplicación

Si estás en el contenedor de la aplicación (root@b546ef6f4e67), necesitas conectarte a PostgreSQL:

```bash
# Instalar cliente de PostgreSQL si no está
apt-get update && apt-get install -y postgresql-client

# Conectarte usando DATABASE_URL
psql "postgres://postgres:eb29c8713fca7d18fa93@inventory_inventaria-db:5432/inventory"
```

Luego ejecuta los comandos GRANT.

## Opción 4: Usando Prisma (Desde el contenedor de la app)

```bash
# Desde el contenedor de la aplicación
echo "GRANT ALL ON SCHEMA public TO postgres;" | ./node_modules/.bin/prisma db execute --stdin
echo "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;" | ./node_modules/.bin/prisma db execute --stdin
echo "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;" | ./node_modules/.bin/prisma db execute --stdin
echo "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;" | ./node_modules/.bin/prisma db execute --stdin
echo "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;" | ./node_modules/.bin/prisma db execute --stdin
```

## Verificar que Funcionó

Después de ejecutar los comandos, verifica:

```sql
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public';
```

Deberías ver que `postgres` tiene varios privilegios.


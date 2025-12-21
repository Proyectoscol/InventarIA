# 🔧 Variables de Entorno en Easypanel (Formato Tradicional)

## Opción 1: Si Easypanel Permite Variables Separadas

Si Easypanel te permite configurar la base de datos con variables separadas, puedes usar:

```env
# Base de Datos (variables separadas)
DB_USER=postgres
DB_PASSWORD=eb29c8713fca7d18fa93
DB_HOST=inventory_inventaria-db
DB_PORT=5432
DB_NAME=inventory
DB_SSL_MODE=disable

# Construir DATABASE_URL desde las variables separadas
DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=${DB_SSL_MODE}
```

**PERO** Prisma necesita `DATABASE_URL` directamente, así que la mejor opción es:

## Opción 2: DATABASE_URL Completa (Recomendado)

```env
DATABASE_URL=postgres://postgres:eb29c8713fca7d18fa93@inventory_inventaria-db:5432/inventory?sslmode=disable
```

## Todas las Variables de Entorno para Easypanel

```env
# ============================================
# Base de Datos
# ============================================
DATABASE_URL=postgres://postgres:eb29c8713fca7d18fa93@inventory_inventaria-db:5432/inventory?sslmode=disable

# ============================================
# NextAuth
# ============================================
NEXTAUTH_SECRET=zmjmjbSxdweDEV8nPNlorYUYnLjadLt4flr7iovlCew=
NEXTAUTH_URL=https://inventory-inventaria.q15bqn.easypanel.host

# ============================================
# Mail (SMTP - Mailgun)
# ============================================
SMTP_ADMIN_EMAIL=noreply@notify.technocol.co
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=api
SMTP_PASS=tu-mailgun-smtp-password
SMTP_SENDER_NAME=Notificaciones Technocol

# ============================================
# Node Environment
# ============================================
NODE_ENV=production
```

## Desglose de DATABASE_URL

Si necesitas construir la URL manualmente:

```
postgres://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=[SSL_MODE]
```

Con tus valores:

```
postgres://postgres:eb29c8713fca7d18fa93@inventory_inventaria-db:5432/inventory?sslmode=disable
```

- **Protocolo**: `postgres://`
- **Usuario**: `postgres`
- **Contraseña**: `eb29c8713fca7d18fa93`
- **Host**: `inventory_inventaria-db` (nombre del servicio en Easypanel)
- **Puerto**: `5432`
- **Base de datos**: `inventory`
- **Parámetros**: `?sslmode=disable` (necesario para conexiones internas)

## Notas Importantes

1. **DATABASE_URL es obligatoria**: Prisma requiere esta variable en formato URL completa
2. **sslmode=disable**: Necesario para conexiones entre contenedores Docker
3. **Host interno**: `inventory_inventaria-db` es el nombre del servicio de PostgreSQL en Easypanel
4. **NEXTAUTH_URL**: Sin barra final `/`

## Si Easypanel Genera Variables Separadas

Si Easypanel te da variables separadas automáticamente, puedes crear un script de inicio que construya `DATABASE_URL`:

```bash
# En el script de inicio, antes de ejecutar Prisma
if [ -z "$DATABASE_URL" ] && [ -n "$DB_HOST" ]; then
  export DATABASE_URL="postgres://${DB_USER:-postgres}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}?sslmode=${DB_SSL_MODE:-disable}"
fi
```

Pero es más simple usar `DATABASE_URL` directamente.


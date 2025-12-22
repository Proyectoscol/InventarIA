# 🔧 Variables de Entorno en Easypanel (Formato Tradicional)

## Formato que Easypanel Puede Generar Automáticamente

Si Easypanel genera variables automáticamente para PostgreSQL, pueden verse así:

```env
POSTGRES_DATABASE=inventory
POSTGRES_HOST=inventory_inventaria-db
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=eb29c8713fca7d18fa93
POSTGRES_PORT=5432
```

## Solución: Construir DATABASE_URL

Prisma **requiere** `DATABASE_URL` en formato URL. Tienes dos opciones:

### Opción 1: Construir DATABASE_URL Manualmente (Recomendado)

Si Easypanel te da las variables separadas, construye `DATABASE_URL` así:

```env
# Variables que Easypanel puede generar
POSTGRES_DATABASE=inventory
POSTGRES_HOST=inventory_inventaria-db
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=eb29c8713fca7d18fa93
POSTGRES_PORT=5432

# Construir DATABASE_URL (OBLIGATORIO para Prisma)
DATABASE_URL=postgres://${POSTGRES_USERNAME}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}?sslmode=disable
```

O directamente:

```env
DATABASE_URL=postgres://postgres:eb29c8713fca7d18fa93@inventory_inventaria-db:5432/inventory?sslmode=disable
```

### Opción 2: Modificar el Script de Inicio

Si Easypanel solo te da variables separadas y no puedes construir `DATABASE_URL` en la interfaz, puedes modificar el script de inicio:

```bash
# Al inicio de scripts/start.sh, antes de usar Prisma
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_HOST" ]; then
  export DATABASE_URL="postgres://${POSTGRES_USERNAME:-postgres}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT:-5432}/${POSTGRES_DATABASE}?sslmode=disable"
  echo "   Construida DATABASE_URL desde variables separadas"
fi
```

## Variables Completas para Easypanel

### Si Easypanel Genera Variables de DB Automáticamente:

```env
# Base de Datos (generadas por Easypanel)
POSTGRES_DATABASE=inventory
POSTGRES_HOST=inventory_inventaria-db
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=eb29c8713fca7d18fa93
POSTGRES_PORT=5432

# Construir DATABASE_URL (agregar manualmente)
DATABASE_URL=postgres://postgres:eb29c8713fca7d18fa93@inventory_inventaria-db:5432/inventory?sslmode=disable
```

### Variables Adicionales (Agregar Manualmente):

```env
# NextAuth
NEXTAUTH_SECRET=zmjmjbSxdweDEV8nPNlorYUYnLjadLt4flr7iovlCew=
NEXTAUTH_URL=https://inventory-inventaria.q15bqn.easypanel.host

# Mail (SMTP - Mailgun)
# ⚠️ IMPORTANTE: Para SMTP necesitas credenciales SMTP específicas del dashboard de Mailgun
# NO uses el API key de la REST API. Las credenciales SMTP son diferentes.
# 
# Cómo obtener las credenciales SMTP:
# 1. Ve a Mailgun Dashboard → Sending → Domains → Tu dominio → Domain Settings → SMTP credentials
# 2. El username típicamente es: postmaster@mg.your-domain.com
# 3. La password es la contraseña SMTP específica (diferente del API key)
#
# Ver MAILGUN-SMTP-SETUP.md para más detalles
SMTP_ADMIN_EMAIL=noreply@notify.technocol.co
SMTP_HOST=smtp.mailgun.org
# Para EU: smtp.eu.mailgun.org
SMTP_PORT=587
# Para SSL: 465
SMTP_USER=postmaster@mg.your-domain.com
# ⚠️ DEBE ser un email válido (no "api")
SMTP_PASS=tu-contraseña-SMTP-específica
# ⚠️ NO es tu API key, es la contraseña SMTP del dashboard
SMTP_SENDER_NAME=Notificaciones Technocol

# Node
NODE_ENV=production
```

## Fórmula para Construir DATABASE_URL

```
postgres://[POSTGRES_USERNAME]:[POSTGRES_PASSWORD]@[POSTGRES_HOST]:[POSTGRES_PORT]/[POSTGRES_DATABASE]?sslmode=disable
```

Con tus valores:

```
postgres://postgres:eb29c8713fca7d18fa93@inventory_inventaria-db:5432/inventory?sslmode=disable
```

## Notas Importantes

1. **DATABASE_URL es obligatoria**: Prisma no puede funcionar sin esta variable
2. **sslmode=disable**: Siempre inclúyelo para conexiones internas en Docker
3. **Si Easypanel genera variables automáticamente**: Asegúrate de agregar también `DATABASE_URL` construida manualmente
4. **NEXTAUTH_URL**: Sin barra final `/`


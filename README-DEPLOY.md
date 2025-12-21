# 🚀 Guía de Deploy en Easypanel

## Configuración Rápida

### 1. Variables de Entorno en Easypanel

Copia estas variables en la configuración de Easypanel:

```env
# Base de Datos (ajusta el nombre del servicio si es diferente)
DATABASE_URL=postgres://postgres:password@inventory_inventaria-db:5432/inventory?sslmode=disable

# NextAuth (GENERA UNO NUEVO)
NEXTAUTH_SECRET=<genera-con-openssl-rand-base64-32>
NEXTAUTH_URL=https://tu-dominio.com

# Mail (SMTP - Mailgun)
SMTP_ADMIN_EMAIL=noreply@notify.technocol.co
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=api
SMTP_PASS=tu-mailgun-smtp-password-aqui
SMTP_SENDER_NAME=Notificaciones Technocol
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
ENABLE_ANONYMOUS_USERS=false

# Node Environment
NODE_ENV=production
```

### 2. Generar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### 3. Pasos en Easypanel

1. **Crear Nuevo Proyecto**
   - Nombre: `inventaria`
   - Tipo: Aplicación

2. **Configurar Base de Datos PostgreSQL**
   - Easypanel creará automáticamente la base de datos
   - El nombre del servicio será algo como `inventory_inventaria-db`
   - Ajusta `DATABASE_URL` con el nombre correcto del servicio

3. **Configurar Servicio de Aplicación**
   - **Build Method**: Dockerfile
   - **Dockerfile Path**: `./Dockerfile`
   - **Puerto**: `3000`
   - **Health Check**: `/api/health`

4. **Agregar Variables de Entorno**
   - Copia todas las variables del paso 1
   - Asegúrate de que `DATABASE_URL` apunte al servicio de DB correcto

5. **Deploy**
   - Easypanel construirá la imagen
   - Ejecutará las migraciones automáticamente
   - Iniciará el servidor

### 4. Verificar Deploy

Una vez desplegado:

1. **Health Check**: Visita `https://tu-dominio.com/api/health`
   - Debe retornar: `{"status":"ok","database":"connected"}`

2. **Crear Primera Cuenta**: Visita `https://tu-dominio.com/register`

3. **Verificar Email**: Las alertas de stock bajo se enviarán automáticamente

## Estructura del Deploy

```
Easypanel
├── inventaria-app
│   ├── Puerto: 3000
│   ├── Health Check: /api/health
│   ├── Auto-migraciones: ✅ (al iniciar)
│   └── Build: Dockerfile
└── inventory_inventaria-db
    ├── Tipo: PostgreSQL
    ├── Base de datos: inventory
    └── Usuario: postgres
```

## Migraciones Automáticas

El Dockerfile está configurado para ejecutar automáticamente:

```bash
npx prisma migrate deploy || npx prisma db push
```

Esto creará todas las tablas necesarias si no existen.

## Troubleshooting

### Error: "relation does not exist"
**Solución**: Las migraciones no se ejecutaron. Verifica los logs del contenedor.

### Error: "Connection refused" (DB)
**Solución**: 
- Verifica que el nombre del servicio DB en `DATABASE_URL` sea correcto
- En Easypanel, el formato suele ser: `nombre-del-servicio-db`

### Error: "Email not sending"
**Solución**:
- Verifica que `SMTP_PASS` sea la contraseña SMTP (no la API key)
- Obtén la contraseña SMTP en Mailgun: Settings > SMTP credentials

### Error: "NEXTAUTH_SECRET is not set"
**Solución**: Asegúrate de configurar `NEXTAUTH_SECRET` en las variables de entorno

## Comandos Útiles (SSH al contenedor)

Si necesitas acceder al contenedor:

```bash
# Ver logs
# (En Easypanel: Logs del servicio)

# Ejecutar migraciones manualmente
npx prisma migrate deploy

# Verificar conexión a DB
npx prisma db pull

# Verificar estado de Prisma
npx prisma studio
```

## Notas Importantes

1. **Migraciones**: Se ejecutan automáticamente al iniciar el contenedor
2. **SMTP**: Usamos SMTP de Mailgun (más compatible que API REST)
3. **Base de Datos**: Easypanel crea la DB automáticamente
4. **Build**: Next.js está optimizado con `output: 'standalone'`

## Soporte

Si tienes problemas:
1. Revisa los logs en Easypanel
2. Verifica el health check: `/api/health`
3. Revisa que todas las variables de entorno estén configuradas

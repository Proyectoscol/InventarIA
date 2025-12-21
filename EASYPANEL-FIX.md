# 🔧 Solución al Error de Volumen en Easypanel

## Error
```
invalid mount config for type "bind": bind source path does not exist: /etc/easypanel/projects/inventory/inventaria/data
```

## Causa
Easypanel está intentando montar un volumen persistente que no existe. Para una aplicación Next.js con Prisma, **NO necesitamos volúmenes** porque:
- La base de datos está en un servicio separado
- No hay archivos que necesiten persistir en el contenedor
- Todo se almacena en PostgreSQL

## Solución

### Opción 1: Configurar en Easypanel (Recomendado)

1. **Ve a la configuración del servicio en Easypanel**
2. **Sección "Volumes" o "Storage"**
3. **Elimina cualquier volumen configurado** o déjalo vacío
4. **Guarda los cambios**

### Opción 2: Si Easypanel requiere volúmenes

Si Easypanel insiste en crear un volumen, puedes:

1. **Crear un volumen vacío** (no bind mount)
2. **O configurar un volumen nombrado** en lugar de bind mount

En la configuración de Easypanel:
- **Tipo de volumen**: `named volume` (no `bind mount`)
- **Path en contenedor**: `/tmp` (o cualquier path temporal)
- **O simplemente desactivar volúmenes**

### Opción 3: Verificar configuración del servicio

En Easypanel, asegúrate de que:

1. **No hay volúmenes configurados** en la sección de Storage
2. **El servicio está configurado correctamente**:
   - Build: Dockerfile
   - Puerto: 3000
   - Health check: `/api/health`

## Configuración Correcta en Easypanel

### Servicio de Aplicación
- **Nombre**: `inventaria-app`
- **Build**: Dockerfile
- **Puerto**: 3000
- **Volúmenes**: **NINGUNO** (vacío)
- **Health Check**: `/api/health`

### Variables de Entorno
```env
DATABASE_URL=postgres://postgres:password@inventory_inventaria-db:5432/inventory?sslmode=disable
NEXTAUTH_SECRET=tu-secreto
NEXTAUTH_URL=https://tu-dominio.com
SMTP_ADMIN_EMAIL=noreply@notify.technocol.co
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=api
SMTP_PASS=tu-password
SMTP_SENDER_NAME=Notificaciones Technocol
NODE_ENV=production
```

## Verificación

Después de corregir:

1. **Reinicia el servicio** en Easypanel
2. **Verifica los logs** - no debería haber errores de volumen
3. **Verifica health check**: `https://tu-dominio.com/api/health`

## Nota Importante

**NO necesitas volúmenes para esta aplicación**. Todo se almacena en PostgreSQL, que es un servicio separado. Los volúmenes solo son necesarios si necesitas persistir archivos en el sistema de archivos del contenedor, lo cual no es el caso aquí.


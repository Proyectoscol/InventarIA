# 🔧 Solución a los Errores de Deploy en Easypanel

## Error 1: Volumen Bind Mount

```
invalid mount config for type "bind": bind source path does not exist: /etc/easypanel/projects/inventory/inventaria/data
```

### Solución:

**En la interfaz de Easypanel:**

1. Ve a tu servicio `inventaria`
2. Click en **"Edit"** o **"Settings"**
3. Busca la sección **"Volumes"** o **"Storage"**
4. **ELIMINA completamente cualquier volumen configurado**
5. Guarda los cambios
6. El servicio se reiniciará automáticamente

**Esta aplicación NO necesita volúmenes** porque todo se almacena en PostgreSQL.

---

## Error 2: Conflicto de Dependencias (RESUELTO)

```
npm error ERESOLVE could not resolve
npm error peerOptional nodemailer@"^7.0.7" from next-auth@4.24.13
```

### Solución Aplicada:

✅ Actualizado `nodemailer` de v6 a v7 en `package.json`
✅ Agregado `--legacy-peer-deps` en el Dockerfile
✅ Corregido formato de ENV en Dockerfile

**Ya está corregido en el código.** Solo necesitas hacer un nuevo deploy.

---

## Pasos para Resolver en Easypanel

### 1. Eliminar Volúmenes (CRÍTICO)

1. Dashboard de Easypanel → Proyecto `inventory`
2. Servicio `inventaria` → **Settings**
3. Sección **"Volumes"** o **"Storage"**
4. **Elimina todos los volúmenes**
5. Guarda

### 2. Hacer Nuevo Deploy

Después de eliminar los volúmenes:

1. Easypanel debería detectar automáticamente el nuevo commit
2. O haz click en **"Redeploy"** o **"Deploy"**
3. El build debería completarse exitosamente ahora

### 3. Verificar

Una vez desplegado:

1. **Logs**: No debería haber errores de volumen
2. **Health Check**: `https://tu-dominio.com/api/health`
3. **Debería retornar**: `{"status":"ok","database":"connected"}`

---

## Configuración Correcta del Servicio

- ✅ **Volúmenes**: NINGUNO (vacío)
- ✅ **Puerto**: 3000
- ✅ **Health Check**: `/api/health`
- ✅ **Build**: Dockerfile
- ✅ **Variables de Entorno**: Todas configuradas

---

## Si el Error Persiste

### Verificar Logs del Build

Si el build sigue fallando:

1. Ve a **"Deployment History"** en Easypanel
2. Click en el último deploy
3. Revisa los logs completos
4. Busca errores específicos

### Verificar Variables de Entorno

Asegúrate de que todas estas variables estén configuradas:

```env
DATABASE_URL=postgres://postgres:password@inventory_inventaria-db:5432/inventory?sslmode=disable
NEXTAUTH_SECRET=tu-secreto-generado
NEXTAUTH_URL=https://tu-dominio.com
SMTP_ADMIN_EMAIL=noreply@notify.technocol.co
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=api
SMTP_PASS=tu-password-smtp
SMTP_SENDER_NAME=Notificaciones Technocol
NODE_ENV=production
```

---

## Resumen

1. ✅ **Código corregido** - nodemailer v7, Dockerfile actualizado
2. ⚠️ **Acción requerida en Easypanel** - Eliminar volúmenes manualmente
3. 🔄 **Nuevo deploy** - Después de eliminar volúmenes, hacer redeploy


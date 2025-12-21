# ✅ Checklist de Deploy en Easypanel

## Antes del Deploy

- [ ] Generar `NEXTAUTH_SECRET` con `openssl rand -base64 32`
- [ ] Verificar que `DATABASE_URL` tenga el formato correcto
- [ ] Confirmar credenciales SMTP de Mailgun
- [ ] Configurar `NEXTAUTH_URL` con el dominio final

## Configuración en Easypanel

### Base de Datos
- [ ] Crear servicio PostgreSQL
- [ ] Anotar el nombre del servicio (ej: `inventory_inventaria-db`)
- [ ] Configurar `DATABASE_URL` con el nombre correcto del servicio

### Aplicación
- [ ] Crear servicio de aplicación
- [ ] Configurar build method: Dockerfile
- [ ] Puerto: 3000
- [ ] Health check: `/api/health`

### Variables de Entorno
- [ ] `DATABASE_URL` (ajustar con nombre del servicio DB)
- [ ] `NEXTAUTH_SECRET` (generado)
- [ ] `NEXTAUTH_URL` (dominio final)
- [ ] `SMTP_ADMIN_EMAIL`
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `SMTP_SENDER_NAME`
- [ ] `NODE_ENV=production`

## Post-Deploy

- [ ] Verificar health check: `https://tu-dominio.com/api/health`
- [ ] Crear primera cuenta: `https://tu-dominio.com/register`
- [ ] Iniciar sesión: `https://tu-dominio.com/login`
- [ ] Crear primera compañía
- [ ] Crear primera bodega
- [ ] Crear primer producto
- [ ] Probar registro de compra
- [ ] Probar registro de venta
- [ ] Verificar que las alertas de email funcionen

## Troubleshooting

Si algo falla:

1. **Revisar logs** en Easypanel
2. **Verificar health check** - debe retornar `{"status":"ok","database":"connected"}`
3. **Verificar variables de entorno** - todas deben estar configuradas
4. **Verificar conexión a DB** - el nombre del servicio debe ser correcto
5. **Verificar SMTP** - las credenciales deben ser correctas

## Comandos Útiles

```bash
# Ver logs del contenedor
# (En Easypanel: Logs del servicio)

# Ejecutar migraciones manualmente (si es necesario)
npx prisma migrate deploy

# Verificar estado de la base de datos
npx prisma db pull
```


# Configuración de Cron Jobs para Verificación de Créditos

## Endpoint de Verificación de Créditos

El sistema incluye un endpoint para verificar créditos vencidos y enviar notificaciones automáticamente:

**URL:** `https://tu-dominio.com/api/cron/check-credits`

**Método:** GET

**Autenticación (Opcional):** 
- Si defines `CRON_SECRET` en las variables de entorno, el endpoint requerirá un header:
  ```
  Authorization: Bearer <CRON_SECRET>
  ```

## Configuración en Easypanel

### Opción 1: Usar el Cron Job de Easypanel

1. Ve a tu proyecto en Easypanel
2. Busca la sección "Cron Jobs" o "Scheduled Tasks"
3. Crea un nuevo cron job con:
   - **Nombre:** Verificar Créditos Vencidos
   - **Schedule:** `0 9 * * *` (todos los días a las 9 AM hora del servidor)
   - **Command:** 
     ```bash
     curl -X GET https://tu-dominio.com/api/cron/check-credits \
       -H "Authorization: Bearer ${CRON_SECRET}"
     ```
   - O si no usas autenticación:
     ```bash
     curl -X GET https://tu-dominio.com/api/cron/check-credits
     ```

### Opción 2: Usar un servicio externo

Puedes usar servicios como:
- **cron-job.org**: https://cron-job.org
- **EasyCron**: https://www.easycron.com
- **Uptime Robot**: https://uptimerobot.com

Configura una tarea que llame al endpoint cada día a la hora deseada.

## Variables de Entorno

Si quieres usar autenticación para el cron job, agrega en Easypanel:

```
CRON_SECRET=tu-secreto-super-seguro-aqui
```

## Qué hace el endpoint

1. Busca todas las compañías con alertas habilitadas
2. Para cada compañía, busca créditos que:
   - Están vencidos (fecha de vencimiento pasada)
   - Vencen hoy
3. Envía un email con la lista de créditos vencidos/por vencer
4. Retorna un resumen de las notificaciones enviadas

## Frecuencia Recomendada

- **Diario:** Una vez al día (por ejemplo, a las 9 AM)
- **Múltiples veces al día:** Si quieres notificaciones más frecuentes, puedes configurar cada 12 horas

## Logs

Los logs del cron job aparecerán en:
- Consola de Easypanel (logs del contenedor)
- Busca mensajes como: `✅ Alerta de créditos enviada para...`

## Prueba Manual

Puedes probar el endpoint manualmente:

```bash
curl -X GET https://tu-dominio.com/api/cron/check-credits
```

O desde el navegador (si no usas autenticación):
```
https://tu-dominio.com/api/cron/check-credits
```


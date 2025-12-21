# Deploy Seguro - Preservación de Datos

## ⚠️ IMPORTANTE: Preservación de Datos

Este sistema está configurado para **NUNCA borrar datos** durante los deploys. El script `start.sh` usa `prisma db push` sin la opción `--force-reset`, lo que significa que:

- ✅ **Preserva todos los datos existentes**
- ✅ Solo crea tablas si no existen
- ✅ Actualiza el esquema sin borrar datos
- ❌ **NUNCA** usa `--force-reset` en producción

## Comportamiento del Script

### En el Primer Deploy:
1. Verifica si hay migraciones
2. Si no hay migraciones, usa `db push` para crear el esquema
3. Si faltan tablas, intenta crearlas manualmente con SQL
4. **NUNCA borra datos existentes**

### En Deploys Subsecuentes:
1. Verifica si hay migraciones nuevas
2. Si hay migraciones, las aplica con `migrate deploy`
3. Si no hay migraciones, usa `db push` para sincronizar cambios
4. **NUNCA borra datos existentes**

## Uso de Migraciones (Recomendado)

Para cambios de esquema en producción, es mejor usar migraciones:

```bash
# Crear una nueva migración
npx prisma migrate dev --name nombre_de_la_migracion

# En producción, las migraciones se aplican automáticamente
```

## Verificación

El script verifica que todas las tablas existan, pero:
- Si faltan tablas, intenta crearlas sin borrar las existentes
- Si hay un error, muestra un mensaje pero **no borra datos**

## Restauración de Datos

Si necesitas restaurar datos:
1. Usa backups de PostgreSQL
2. **NUNCA** uses `db push --force-reset` en producción
3. Si necesitas resetear, hazlo manualmente y con precaución


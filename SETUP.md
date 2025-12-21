# Guía de Configuración Rápida

## Pasos para Iniciar el Proyecto

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Base de Datos

#### Opción A: Usar Neon (Recomendado para desarrollo)
1. Ve a [Neon](https://neon.tech) y crea una cuenta gratuita
2. Crea un nuevo proyecto PostgreSQL
3. Copia la connection string

#### Opción B: PostgreSQL Local
1. Instala PostgreSQL localmente
2. Crea una base de datos: `CREATE DATABASE inventaria;`

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Base de Datos (usa tu connection string de Neon o PostgreSQL local)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth (genera un secreto seguro)
NEXTAUTH_SECRET="tu-secreto-super-seguro-aqui-genera-uno-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Mailgun (opcional para alertas)
MAILGUN_API_KEY="tu-mailgun-api-key"
MAILGUN_DOMAIN="tu-dominio.mailgun.org"
MAILGUN_FROM_EMAIL="Sistema Inventario <noreply@tu-dominio.mailgun.org>"
```

**Generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Inicializar Base de Datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear las tablas en la base de datos
npx prisma db push

# (Opcional) Abrir Prisma Studio para ver los datos
npx prisma studio
```

### 5. Configurar Mailgun (Opcional)

1. Ve a [Mailgun](https://www.mailgun.com/)
2. Crea una cuenta gratuita (5,000 emails/mes)
3. Verifica tu dominio o usa el dominio sandbox para pruebas
4. Obtén tu API Key desde Settings > API Keys
5. Agrega las credenciales a `.env.local`

**Nota:** Si no configuras Mailgun, las alertas no se enviarán pero el resto del sistema funcionará normalmente.

### 6. Iniciar el Servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 7. Crear tu Primera Cuenta

1. Ve a `/register`
2. Crea una cuenta de usuario
3. Inicia sesión en `/login`

### 8. Configurar tu Primera Compañía

1. Una vez dentro del dashboard, necesitarás crear una compañía
2. Luego crea bodegas
3. Agrega productos
4. ¡Comienza a registrar compras y ventas!

## Solución de Problemas

### Error: "Prisma Client not generated"
```bash
npx prisma generate
```

### Error: "Database connection failed"
- Verifica que tu `DATABASE_URL` sea correcta
- Asegúrate de que PostgreSQL esté corriendo (si es local)
- Si usas Neon, verifica que el proyecto esté activo

### Error: "NEXTAUTH_SECRET is not set"
- Asegúrate de tener un archivo `.env.local`
- Genera un nuevo secreto con `openssl rand -base64 32`

### Las alertas no se envían
- Verifica que Mailgun esté configurado correctamente
- Revisa la consola del servidor para ver errores
- Asegúrate de que los emails en `alertEmails` sean válidos

## Próximos Pasos

1. **Personaliza la UI**: Modifica los componentes en `/components`
2. **Agrega más reportes**: Crea nuevas rutas en `/app/api/reports`
3. **Configura el dominio**: Cuando estés listo para producción, configura tu dominio en Vercel
4. **Optimiza imágenes**: Considera usar Cloudinary o S3 para almacenar imágenes en producción

## Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de NextAuth](https://next-auth.js.org)
- [Documentación de Mailgun](https://documentation.mailgun.com)


# InventarIA - Sistema de Gestión de Inventario Multi-Compañía

Sistema completo de gestión de inventario con soporte multi-bodega, control FIFO, alertas automatizadas por email y análisis financiero.

## 🚀 Características Principales

- ✅ **Multi-Compañía**: Gestiona múltiples compañías desde una sola cuenta
- ✅ **Multi-Bodega**: Control de inventario por bodega
- ✅ **Método FIFO**: Gestión automática de lotes con método First-In-First-Out
- ✅ **Alertas Automatizadas**: Notificaciones por email cuando el stock está bajo
- ✅ **Análisis Financiero**: Reportes de ventas, compras, utilidades y flujo de caja
- ✅ **Gestión de Clientes**: Registro y seguimiento de clientes
- ✅ **Mobile-First**: Interfaz optimizada para dispositivos móviles
- ✅ **Búsqueda Predictiva**: Búsqueda rápida de productos con creación en tiempo real

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL (o usar Neon/Supabase)
- Cuenta de Mailgun (para alertas por email)

## 🛠️ Instalación

1. **Clonar e instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_SECRET="tu-secreto-super-seguro-aqui"
NEXTAUTH_URL="http://localhost:3000"
MAILGUN_API_KEY="tu-mailgun-api-key"
MAILGUN_DOMAIN="tu-dominio.mailgun.org"
MAILGUN_FROM_EMAIL="Sistema Inventario <noreply@tu-dominio.mailgun.org>"
```

3. **Configurar la base de datos:**
```bash
npx prisma generate
npx prisma db push
```

4. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
InventarIA/
├── app/                    # Next.js App Router
│   ├── api/               # Rutas API
│   ├── dashboard/         # Páginas del dashboard
│   ├── login/             # Página de login
│   └── register/          # Página de registro
├── components/            # Componentes React
│   ├── ui/               # Componentes UI base (shadcn/ui)
│   └── forms/            # Formularios
├── lib/                  # Utilidades y configuraciones
│   ├── prisma.ts         # Cliente de Prisma
│   ├── auth.ts           # Configuración de NextAuth
│   └── email.ts          # Utilidades de email
├── prisma/               # Esquema de Prisma
│   └── schema.prisma     # Esquema de base de datos
└── types/                # Tipos TypeScript
```

## 🗄️ Esquema de Base de Datos

El sistema utiliza PostgreSQL con Prisma ORM. Las entidades principales son:

- **User**: Usuarios del sistema
- **Company**: Compañías
- **Warehouse**: Bodegas por compañía
- **Product**: Productos únicos por compañía
- **Stock**: Stock por producto y bodega
- **Batch**: Lotes de compra (FIFO)
- **Movement**: Movimientos de ingreso/egreso
- **Customer**: Clientes
- **AlertConfig**: Configuración de alertas por email

## 🔐 Autenticación

El sistema utiliza NextAuth.js con autenticación por credenciales (email/password). Las contraseñas se hashean con bcrypt.

## 📧 Configuración de Mailgun

1. Crea una cuenta en [Mailgun](https://www.mailgun.com/)
2. Verifica tu dominio o usa el dominio sandbox para pruebas
3. Obtén tu API Key desde Settings > API Keys
4. Configura las variables de entorno en `.env.local`

## 🎯 Uso Básico

### 1. Crear una Compañía
- Ve a Configuración > Compañías
- Crea una nueva compañía
- Configura los emails para alertas

### 2. Crear Bodegas
- Ve a Configuración > Bodegas
- Crea las bodegas necesarias

### 3. Agregar Productos
- Ve a Inventario
- Busca un producto o créalo si no existe
- Configura el umbral mínimo de stock

### 4. Registrar Compras
- Ve a Movimientos > Nueva Compra
- Selecciona bodega y producto
- Ingresa cantidad y precio
- El sistema crea automáticamente un lote (FIFO)

### 5. Registrar Ventas
- Ve a Movimientos > Nueva Venta
- Selecciona bodega y producto
- Ingresa cantidad y precio de venta
- El sistema aplica FIFO automáticamente
- Si el stock queda bajo el umbral, se envía alerta por email

### 6. Ver Reportes
- Ve a Estadísticas
- Filtra por fecha, bodega, producto
- Revisa ventas, compras, utilidades y rotación

## 🔄 Lógica FIFO

El sistema implementa First-In-First-Out automáticamente:

1. Al registrar una compra, se crea un lote con fecha de compra
2. Al registrar una venta, se consumen los lotes más antiguos primero
3. El costo unitario se calcula promediando los lotes consumidos
4. La ganancia se calcula como: (precio_venta - costo_promedio) * cantidad

## 📊 Reportes Disponibles

- **Ventas**: Total de ventas, efectivo, créditos pendientes
- **Compras**: Total de compras por período
- **Utilidad**: Ganancia neta, margen, top productos
- **Rotación**: Productos de alta/baja rotación
- **Stock Bajo**: Productos por debajo del umbral

## 🚨 Sistema de Alertas

Las alertas se envían automáticamente cuando:
- El stock de un producto cae por debajo del umbral mínimo
- Se registra una venta que deja el stock bajo

Configuración:
- Ve a Configuración > Alertas
- Agrega emails para recibir notificaciones
- Activa/desactiva las alertas

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación con NextAuth.js
- Validación de datos con Zod
- Protección de rutas API con sesiones

## 📝 Próximas Mejoras

- [ ] Exportación de reportes a PDF/Excel
- [ ] Dashboard con gráficos interactivos
- [ ] Notificaciones push
- [ ] Integración con sistemas de pago
- [ ] App móvil nativa
- [ ] Multi-idioma

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Para problemas o preguntas, abre un issue en el repositorio.

---

Desarrollado con ❤️ usando Next.js, TypeScript, Prisma y PostgreSQL


# 📧 Configuración de Mailgun SMTP

## ⚠️ Importante: SMTP vs API REST

Mailgun tiene **dos formas diferentes** de autenticación:

1. **API REST**: Usa `api` como username y tu **API Key** como password
2. **SMTP**: Usa un **email verificado** como username y una **contraseña SMTP específica** como password

Este proyecto usa **SMTP**, por lo que necesitas las credenciales SMTP, NO el API key.

## 🔑 Obtener Credenciales SMTP de Mailgun

### Paso 1: Acceder al Dashboard de Mailgun

1. Ve a [Mailgun Dashboard](https://app.mailgun.com/)
2. Inicia sesión en tu cuenta

### Paso 2: Encontrar las Credenciales SMTP

1. En el menú lateral, haz clic en **"Sending"** → **"Domains"**
2. Selecciona tu dominio (o el dominio sandbox si estás en modo prueba)
3. Haz clic en **"Domain Settings"** (o el ícono de configuración)
4. Busca la sección **"SMTP credentials"** o **"SMTP"**

### Paso 3: Copiar las Credenciales

Verás algo como:

```
SMTP hostname: smtp.mailgun.org (o smtp.eu.mailgun.org para EU)
SMTP port: 587 (o 465 para SSL)
SMTP username: postmaster@mg.your-domain.com
SMTP password: [tu-contraseña-SMTP-específica]
```

**⚠️ IMPORTANTE:**
- El **username** es un email (típicamente `postmaster@mg.your-domain.com`)
- La **password** es diferente a tu API key de la REST API
- Si no ves las credenciales SMTP, es posible que necesites habilitarlas o crear un dominio verificado

## 📝 Configuración en Easypanel

Configura estas variables de entorno en Easypanel:

```env
# Mailgun SMTP (NO uses el API key aquí)
SMTP_HOST=smtp.mailgun.org
# Para EU: smtp.eu.mailgun.org

SMTP_PORT=587
# Para SSL: 465

SMTP_USER=postmaster@mg.your-domain.com
# ⚠️ DEBE ser un email válido, no "api"

SMTP_PASS=tu-contraseña-SMTP-específica
# ⚠️ NO es tu API key, es la contraseña SMTP del dashboard

SMTP_ADMIN_EMAIL=noreply@notify.technocol.co
# Email que aparecerá como remitente

SMTP_SENDER_NAME=Notificaciones Technocol
# Nombre que aparecerá como remitente
```

## 🌍 Regiones de Mailgun

Mailgun tiene dos regiones:

### US (Estados Unidos)
- SMTP Host: `smtp.mailgun.org`
- API Base: `https://api.mailgun.net/`

### EU (Europa)
- SMTP Host: `smtp.eu.mailgun.org`
- API Base: `https://api.eu.mailgun.net/`

**Usa la región donde creaste tu dominio.**

## 🔍 Verificar Configuración

Si ves este error:
```
Error: Invalid login: 501 Username used for auth is not valid email address
```

Significa que:
1. `SMTP_USER` no es un email válido
2. O estás usando "api" en lugar de las credenciales SMTP

**Solución:**
- Asegúrate de que `SMTP_USER` sea un email (ej: `postmaster@mg.your-domain.com`)
- Verifica que `SMTP_PASS` sea la contraseña SMTP, no el API key

## 📚 Referencias

- [Mailgun SMTP Documentation](https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp)
- [Mailgun API Documentation](https://documentation.mailgun.com/en/latest/api_reference.html)

## 💡 Nota sobre Dominios Sandbox

Si estás usando el dominio sandbox de Mailgun (para pruebas), las credenciales SMTP pueden tener un formato diferente. Verifica en el dashboard de Mailgun las credenciales exactas para tu dominio.


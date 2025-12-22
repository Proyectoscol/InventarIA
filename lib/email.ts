import nodemailer from "nodemailer"

// Configurar transporter de nodemailer con Mailgun SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailgun.org",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER || "api",
    pass: process.env.SMTP_PASS || ""
  }
})

// Verificar conexión al inicializar
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Error en configuración SMTP:", error)
  } else {
    console.log("✅ Servidor SMTP listo para enviar emails")
  }
})

export async function sendStockAlert({
  to,
  productName,
  warehouseName,
  currentStock,
  threshold,
  belowBy,
  lastUnitCost
}: {
  to: string[]
  productName: string
  warehouseName: string
  currentStock: number
  threshold: number
  belowBy: number
  lastUnitCost: number
}) {
  const emailBody = `
⚠️ ALERTA DE INVENTARIO BAJO ⚠️

Producto: ${productName}
Bodega: ${warehouseName}

Stock Actual: ${currentStock} unidades
Umbral Mínimo: ${threshold} unidades
Déficit: ${belowBy} unidades por debajo del umbral

Último Precio de Compra: ${Number(lastUnitCost).toLocaleString("es-CO")} COP

Se recomienda realizar un pedido de reposición.

---
Este es un mensaje automático del Sistema de Inventario.
  `.trim()

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">⚠️ ALERTA DE INVENTARIO BAJO ⚠️</h2>
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
        <p><strong>Producto:</strong> ${productName}</p>
        <p><strong>Bodega:</strong> ${warehouseName}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
        <p><strong>Stock Actual:</strong> ${currentStock} unidades</p>
        <p><strong>Umbral Mínimo:</strong> ${threshold} unidades</p>
        <p><strong>Déficit:</strong> ${belowBy} unidades por debajo del umbral</p>
        <p><strong>Último Precio de Compra:</strong> ${Number(lastUnitCost).toLocaleString("es-CO")} COP</p>
      </div>
      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        Se recomienda realizar un pedido de reposición.
      </p>
      <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
        Este es un mensaje automático del Sistema de Inventario.
      </p>
    </div>
  `

  try {
    // Enviar a múltiples destinatarios
    const mailOptions = {
      from: `"${process.env.SMTP_SENDER_NAME || "Sistema Inventario"}" <${process.env.SMTP_ADMIN_EMAIL}>`,
      to: to.join(", "),
      subject: `🔴 Alerta: Stock Bajo - ${productName}`,
      text: emailBody,
      html: htmlBody
    }

    console.log("📧 Intentando enviar alerta de stock a:", to.join(", "))
    console.log("📧 Configuración SMTP:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_ADMIN_EMAIL
    })

    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Alerta enviada para ${productName} a ${to.join(", ")}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("❌ Error enviando email de stock:", error)
    console.error("❌ Detalles del error:", {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode
    })
    throw error
  }
}

export async function sendCreditDueAlert({
  to,
  movements
}: {
  to: string[]
  movements: Array<{
    movementNumber: string
    customerName: string
    productName: string
    creditAmount: number
    dueDate: Date
    daysOverdue?: number
  }>
}) {
  const isOverdue = movements.some(m => m.daysOverdue && m.daysOverdue > 0)
  const subject = isOverdue 
    ? `🔴 Alerta: Créditos Vencidos (${movements.length})`
    : `⚠️ Recordatorio: Créditos por Vencer (${movements.length})`

  const emailBody = `
${isOverdue ? "🔴 ALERTA: CRÉDITOS VENCIDOS" : "⚠️ RECORDATORIO: CRÉDITOS POR VENCER"}

Total de créditos: ${movements.length}

${movements.map((m, i) => `
${i + 1}. ${m.movementNumber}
   Cliente: ${m.customerName}
   Producto: ${m.productName}
   Monto: ${Number(m.creditAmount).toLocaleString("es-CO")} COP
   Fecha de Vencimiento: ${new Date(m.dueDate).toLocaleDateString("es-CO")}
   ${m.daysOverdue ? `⚠️ Vencido hace ${m.daysOverdue} días` : "⏰ Por vencer"}
`).join("\n")}

---
Este es un mensaje automático del Sistema de Inventario.
  `.trim()

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isOverdue ? "#dc2626" : "#f59e0b"};">
        ${isOverdue ? "🔴 ALERTA: CRÉDITOS VENCIDOS" : "⚠️ RECORDATORIO: CRÉDITOS POR VENCER"}
      </h2>
      <div style="background-color: ${isOverdue ? "#fef2f2" : "#fffbeb"}; padding: 20px; border-radius: 8px; border-left: 4px solid ${isOverdue ? "#dc2626" : "#f59e0b"};">
        <p><strong>Total de créditos:</strong> ${movements.length}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
        ${movements.map((m, i) => `
          <div style="margin-bottom: 15px; padding: 10px; background-color: white; border-radius: 4px;">
            <p><strong>${i + 1}. ${m.movementNumber}</strong></p>
            <p><strong>Cliente:</strong> ${m.customerName}</p>
            <p><strong>Producto:</strong> ${m.productName}</p>
            <p><strong>Monto:</strong> ${Number(m.creditAmount).toLocaleString("es-CO")} COP</p>
            <p><strong>Fecha de Vencimiento:</strong> ${new Date(m.dueDate).toLocaleDateString("es-CO")}</p>
            ${m.daysOverdue ? `<p style="color: #dc2626; font-weight: bold;">⚠️ Vencido hace ${m.daysOverdue} días</p>` : "<p style="color: #f59e0b;">⏰ Por vencer</p>"}
          </div>
        `).join("")}
      </div>
      <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
        Este es un mensaje automático del Sistema de Inventario.
      </p>
    </div>
  `

  try {
    const mailOptions = {
      from: `"${process.env.SMTP_SENDER_NAME || "Sistema Inventario"}" <${process.env.SMTP_ADMIN_EMAIL}>`,
      to: to.join(", "),
      subject: subject,
      text: emailBody,
      html: htmlBody
    }

    console.log("📧 Intentando enviar alerta de créditos a:", to.join(", "))
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Alerta de créditos enviada a ${to.join(", ")}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("❌ Error enviando email de créditos:", error)
    console.error("❌ Detalles del error:", {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode
    })
    throw error
  }
}

export async function sendTestEmail(to: string) {
  try {
    const mailOptions = {
      from: `"${process.env.SMTP_SENDER_NAME || "Sistema Inventario"}" <${process.env.SMTP_ADMIN_EMAIL}>`,
      to: to,
      subject: "Prueba de Configuración - Sistema de Inventario",
      text: "¡La configuración de email está funcionando correctamente!",
      html: "<p>¡La configuración de email está funcionando correctamente!</p>"
    }

    console.log("📧 Enviando email de prueba a:", to)
    const info = await transporter.sendMail(mailOptions)
    console.log("✅ Email de prueba enviado:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("❌ Error en email de prueba:", error)
    console.error("❌ Detalles:", {
      message: error.message,
      code: error.code,
      response: error.response
    })
    return { success: false, error: error.message }
  }
}
Action
Commit: Feat: Implement comprehensive credit management system with due dates

- Added creditDueDate and creditPaidDate fields to Movement schema
- Calculate creditDueDate when creating sales (movementDate + creditDays)
- Created endpoint to mark credits as paid with date
- Updated cash flow calculations to only count paid credits (not overdue)
- Created credit management API endpoints (list by status: pending/overdue/paid)
- Created credit due date alert system with email notifications
- Enhanced email system with better error logging and SMTP verification
- Added sendCreditDueAlert function for credit expiration notifications
- Credits now properly tracked: pending -> overdue -> paid
- Only paid credits count toward cash received 
##########################################
### Download Github Archive Started...
### Mon, 22 Dec 2025 06:33:04 GMT
##########################################

#0 building with "default" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 2.68kB done
#1 DONE 0.0s

#2 [internal] load metadata for docker.io/library/node:20-alpine
#2 DONE 0.2s

#3 [internal] load .dockerignore
#3 transferring context: 142B done
#3 DONE 0.0s

#4 [base 1/2] FROM docker.io/library/node:20-alpine@sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537c9d9272f488ac03a370d448
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 737.50kB 0.0s done
#5 DONE 0.0s

#6 [base 2/2] RUN apk add --no-cache libc6-compat openssl
#6 CACHED

#7 [deps 1/6] WORKDIR /app
#7 CACHED

#8 [deps 2/6] COPY prisma ./prisma
#8 DONE 0.0s

#9 [deps 3/6] RUN mkdir -p ./scripts
#9 DONE 0.1s

#10 [deps 4/6] COPY scripts/build-db-url.js ./scripts/build-db-url.js
#10 DONE 0.0s

#11 [deps 5/6] COPY package.json package-lock.json* ./
#11 DONE 0.0s

#12 [deps 6/6] RUN npm ci --legacy-peer-deps
#12 2.410 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
#12 2.975 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
#12 4.278 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
#12 4.279 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
#12 4.716 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
#12 11.41 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
#12 18.00 
#12 18.00 > inventaria@0.1.0 postinstall
#12 18.00 > node scripts/build-db-url.js && prisma generate
#12 18.00 
#12 18.59 Prisma schema loaded from prisma/schema.prisma
#12 19.28 
#12 19.28 ✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 215ms
#12 19.28 
#12 19.28 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
#12 19.28 
#12 19.28 Tip: Want to react to database changes in your app as they happen? Discover how with Pulse: https://pris.ly/tip-1-pulse
#12 19.28 
#12 19.50 
#12 19.50 added 563 packages, and audited 564 packages in 19s
#12 19.50 
#12 19.50 168 packages are looking for funding
#12 19.50   run `npm fund` for details
#12 19.55 
#12 19.55 3 high severity vulnerabilities
#12 19.55 
#12 19.55 To address all issues (including breaking changes), run:
#12 19.55   npm audit fix --force
#12 19.55 
#12 19.55 Run `npm audit` for details.
#12 19.55 npm notice
#12 19.55 npm notice New major version of npm available! 10.8.2 -> 11.7.0
#12 19.55 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#12 19.55 npm notice To update run: npm install -g npm@11.7.0
#12 19.55 npm notice
#12 DONE 19.9s

#13 [builder 2/4] COPY --from=deps /app/node_modules ./node_modules
#13 DONE 9.3s

#14 [builder 3/4] COPY . .
#14 DONE 0.1s

#15 [builder 4/4] RUN npm run build
#15 0.397 
#15 0.397 > inventaria@0.1.0 build
#15 0.397 > next build
#15 0.397 
#15 1.061   ▲ Next.js 14.2.35
#15 1.062 
#15 1.078    Creating an optimized production build ...
#15 10.17 Failed to compile.
#15 10.17 
#15 10.17 ./lib/email.ts
#15 10.17 Error: 
#15 10.17   x Expected '}', got 'color'
#15 10.17      ,-[/app/lib/email.ts:161:1]
#15 10.17  161 |             <p><strong>Producto:</strong> ${m.productName}</p>
#15 10.17  162 |             <p><strong>Monto:</strong> ${Number(m.creditAmount).toLocaleString("es-CO")} COP</p>
#15 10.17  163 |             <p><strong>Fecha de Vencimiento:</strong> ${new Date(m.dueDate).toLocaleDateString("es-CO")}</p>
#15 10.17  164 |             ${m.daysOverdue ? `<p style="color: #dc2626; font-weight: bold;">⚠️ Vencido hace ${m.daysOverdue} días</p>` : "<p style="color: #f59e0b;">⏰ Por vencer</p>"}
#15 10.17      :                                                                                                                                           ^^^^^
#15 10.17  165 |           </div>
#15 10.17  166 |         `).join("")}
#15 10.17  167 |       </div>
#15 10.17      `----
#15 10.17 
#15 10.17 Caused by:
#15 10.17     Syntax Error
#15 10.17 
#15 10.17 Import trace for requested module:
#15 10.17 ./lib/email.ts
#15 10.17 ./app/api/credits/check-due/route.ts
#15 10.17 
#15 10.18 
#15 10.18 > Build failed because of webpack errors
#15 10.20 npm notice
#15 10.20 npm notice New major version of npm available! 10.8.2 -> 11.7.0
#15 10.20 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
#15 10.20 npm notice To update run: npm install -g npm@11.7.0
#15 10.20 npm notice
#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
 > [builder 4/4] RUN npm run build:
10.17 ./lib/email.ts
10.17 ./app/api/credits/check-due/route.ts
10.17 
10.18 
10.18 > Build failed because of webpack errors
10.20 npm notice
10.20 npm notice New major version of npm available! 10.8.2 -> 11.7.0
10.20 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
10.20 npm notice To update run: npm install -g npm@11.7.0
10.20 npm notice
------
Dockerfile:36
--------------------
  34 |     
  35 |     # Build de Next.js
  36 | >>> RUN npm run build
  37 |     
  38 |     # Production image, copy all the files and run next
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
##########################################
### Error
### Mon, 22 Dec 2025 06:33:48 GMT
##########################################
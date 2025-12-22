import Mailgun from "mailgun.js"
import formData from "form-data"

// Configurar cliente de Mailgun usando la API REST
// Usa el API key directamente (SMTP_USER=api, SMTP_PASS=API_KEY)
// Extraer el dominio del email de administración
const getDomainFromEmail = (email: string): string => {
  const match = email.match(/@(.+)/)
  if (match) {
    // Si es un email de Mailgun (ej: noreply@notify.technocol.co)
    // El dominio puede ser el dominio verificado en Mailgun
    // Por defecto, intentamos extraer el dominio después de @
    return match[1]
  }
  return ""
}

// Función para obtener el cliente de Mailgun (lazy initialization)
function getMailgunClient() {
  const mailgunDomain = process.env.MAILGUN_DOMAIN || getDomainFromEmail(process.env.SMTP_ADMIN_EMAIL || "")
  const mailgunApiKey = process.env.SMTP_PASS || ""
  const mailgunRegion = process.env.SMTP_HOST?.includes("eu") ? "EU" : "US"

  if (!mailgunApiKey) {
    throw new Error("MAILGUN_API_KEY (SMTP_PASS) no está configurado")
  }

  if (!mailgunDomain) {
    throw new Error("MAILGUN_DOMAIN no está configurado y no se pudo extraer del SMTP_ADMIN_EMAIL")
  }

  // Inicializar cliente de Mailgun
  const mailgun = new Mailgun(formData)
  const mg = mailgun.client({
    username: "api",
    key: mailgunApiKey,
    url: mailgunRegion === "EU" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net"
  })

  return { mg, domain: mailgunDomain }
}

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
    const { mg, domain } = getMailgunClient()
    
    console.log("📧 Intentando enviar alerta de stock a:", to.join(", "))
    console.log("📧 Configuración Mailgun:", {
      domain: domain,
      from: process.env.SMTP_ADMIN_EMAIL
    })

    // Enviar usando la API REST de Mailgun
    const messageData = {
      from: `"${process.env.SMTP_SENDER_NAME || "Sistema Inventario"}" <${process.env.SMTP_ADMIN_EMAIL}>`,
      to: to,
      subject: `🔴 Alerta: Stock Bajo - ${productName}`,
      text: emailBody,
      html: htmlBody
    }

    const response = await mg.messages.create(domain, messageData)
    console.log(`✅ Alerta enviada para ${productName} a ${to.join(", ")}:`, response.id)
    return { success: true, messageId: response.id }
  } catch (error: any) {
    console.error("❌ Error enviando email de stock:", error)
    console.error("❌ Detalles del error:", {
      message: error.message,
      status: error.status,
      details: error.details
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
            ${m.daysOverdue ? `<p style="color: #dc2626; font-weight: bold;">⚠️ Vencido hace ${m.daysOverdue} días</p>` : `<p style="color: #f59e0b;">⏰ Por vencer</p>`}
          </div>
        `).join("")}
      </div>
      <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
        Este es un mensaje automático del Sistema de Inventario.
      </p>
    </div>
  `

  try {
    const { mg, domain } = getMailgunClient()
    
    console.log("📧 Intentando enviar alerta de créditos a:", to.join(", "))
    
    // Enviar usando la API REST de Mailgun
    const messageData = {
      from: `"${process.env.SMTP_SENDER_NAME || "Sistema Inventario"}" <${process.env.SMTP_ADMIN_EMAIL}>`,
      to: to,
      subject: subject,
      text: emailBody,
      html: htmlBody
    }

    const response = await mg.messages.create(domain, messageData)
    console.log(`✅ Alerta de créditos enviada a ${to.join(", ")}:`, response.id)
    return { success: true, messageId: response.id }
  } catch (error: any) {
    console.error("❌ Error enviando email de créditos:", error)
    console.error("❌ Detalles del error:", {
      message: error.message,
      status: error.status,
      details: error.details
    })
    throw error
  }
}

export async function sendTestEmail(to: string) {
  try {
    const { mg, domain } = getMailgunClient()
    
    console.log("📧 Enviando email de prueba a:", to)
    
    // Enviar usando la API REST de Mailgun
    const messageData = {
      from: `"${process.env.SMTP_SENDER_NAME || "Sistema Inventario"}" <${process.env.SMTP_ADMIN_EMAIL}>`,
      to: [to],
      subject: "Prueba de Configuración - Sistema de Inventario",
      text: "¡La configuración de email está funcionando correctamente!",
      html: "<p>¡La configuración de email está funcionando correctamente!</p>"
    }

    const response = await mg.messages.create(domain, messageData)
    console.log("✅ Email de prueba enviado:", response.id)
    return { success: true, messageId: response.id }
  } catch (error: any) {
    console.error("❌ Error en email de prueba:", error)
    console.error("❌ Detalles:", {
      message: error.message,
      status: error.status,
      details: error.details
    })
    return { success: false, error: error.message }
  }
}

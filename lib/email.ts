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

    const info = await transporter.sendMail(mailOptions)
    console.log(`Alerta enviada para ${productName} a ${to.join(", ")}:`, info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error enviando email:", error)
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

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error en email de prueba:", error)
    return { success: false, error }
  }
}

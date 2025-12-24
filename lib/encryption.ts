import crypto from "crypto"

// Clave de encriptación basada en NEXTAUTH_SECRET o una clave específica
// En producción, deberías usar una variable de entorno específica para esto
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "default-encryption-key-change-in-production"
const ALGORITHM = "aes-256-cbc"

// Asegurar que la clave tenga 32 bytes (256 bits)
function getEncryptionKey(): Buffer {
  const key = ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)
  return Buffer.from(key, "utf-8")
}

/**
 * Encripta un texto usando AES-256-CBC
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    
    // Retornar IV + texto encriptado (IV se necesita para desencriptar)
    return iv.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("Error encriptando:", error)
    throw new Error("Error al encriptar el texto")
  }
}

/**
 * Desencripta un texto encriptado con AES-256-CBC
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedText.split(":")
    
    if (parts.length !== 2) {
      throw new Error("Formato de texto encriptado inválido")
    }
    
    const iv = Buffer.from(parts[0], "hex")
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")
    
    return decrypted
  } catch (error) {
    console.error("Error desencriptando:", error)
    throw new Error("Error al desencriptar el texto")
  }
}

/**
 * Obtiene los últimos N caracteres de una cadena (útil para mostrar parcialmente API Keys)
 */
export function getLastChars(text: string, count: number = 10): string {
  if (!text || text.length === 0) return ""
  return text.slice(-count)
}


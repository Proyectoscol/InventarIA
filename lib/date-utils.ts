/**
 * Utilidades para manejar fechas en la zona horaria de Colombia (America/Bogota, UTC-5)
 */

const COLOMBIA_TIMEZONE = "America/Bogota"

/**
 * Convierte una fecha a la zona horaria de Colombia
 */
export function toColombiaTime(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date
  
  // Obtener la fecha en formato local de Colombia
  const colombiaDate = new Date(d.toLocaleString("en-US", { timeZone: COLOMBIA_TIMEZONE }))
  
  // Ajustar para mantener la hora correcta
  const utcDate = new Date(d.toISOString())
  const colombiaOffset = -5 * 60 // UTC-5 en minutos
  const localOffset = utcDate.getTimezoneOffset()
  const offsetDiff = colombiaOffset - localOffset
  
  return new Date(utcDate.getTime() + offsetDiff * 60 * 1000)
}

/**
 * Obtiene la fecha actual en la zona horaria de Colombia
 */
export function getColombiaNow(): Date {
  const now = new Date()
  return toColombiaTime(now)
}

/**
 * Convierte una fecha a string en formato YYYY-MM-DD en zona horaria de Colombia
 */
export function toColombiaDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const colombiaDate = new Date(d.toLocaleString("en-US", { timeZone: COLOMBIA_TIMEZONE }))
  
  const year = colombiaDate.getFullYear()
  const month = String(colombiaDate.getMonth() + 1).padStart(2, "0")
  const day = String(colombiaDate.getDate()).padStart(2, "0")
  
  return `${year}-${month}-${day}`
}

/**
 * Obtiene el día del mes en zona horaria de Colombia
 */
export function getColombiaDay(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date
  const colombiaDate = new Date(d.toLocaleString("en-US", { timeZone: COLOMBIA_TIMEZONE }))
  return colombiaDate.getDate()
}

/**
 * Crea un rango de fechas para un día completo en zona horaria de Colombia
 */
export function getColombiaDayRange(dateString: string): { start: Date; end: Date } {
  // Parsear la fecha como si fuera en Colombia
  const [year, month, day] = dateString.split("-").map(Number)
  
  // Crear fecha de inicio (00:00:00) en Colombia
  const startStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00-05:00`
  const start = new Date(startStr)
  
  // Crear fecha de fin (23:59:59) en Colombia
  const endStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T23:59:59-05:00`
  const end = new Date(endStr)
  
  return { start, end }
}

/**
 * Formatea una fecha a hora en formato colombiano
 */
export function formatColombiaTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("es-CO", { 
    hour: "2-digit", 
    minute: "2-digit",
    timeZone: COLOMBIA_TIMEZONE
  })
}

/**
 * Formatea una fecha completa en formato colombiano
 */
export function formatColombiaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: COLOMBIA_TIMEZONE
  })
}


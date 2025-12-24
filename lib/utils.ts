import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  // Formato con coma como separador de miles y punto como separador decimal
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function formatNumber(amount: number): string {
  // Formato con coma como separador de miles (sin símbolo de moneda)
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, ""))
}


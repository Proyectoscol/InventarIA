import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
})

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida")
})

export const companySchema = z.object({
  name: z.string().min(1, "El nombre de la compañía es requerido"),
  alertEmails: z.array(z.string().email()).optional(),
  enableAlerts: z.boolean().optional()
})

export const warehouseSchema = z.object({
  name: z.string().min(1, "El nombre de la bodega es requerido"),
  description: z.string().optional()
})

export const productSchema = z.object({
  name: z.string().min(1, "El nombre del producto es requerido"),
  description: z.string().optional(),
  imageBase64: z.string().optional(),
  minStockThreshold: z.number().int().min(0).default(10)
})

export const purchaseSchema = z.object({
  warehouseId: z.string().min(1, "Selecciona una bodega"),
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
  price: z.number().min(0.01, "El precio unitario es obligatorio y debe ser mayor a 0"),
  priceType: z.enum(["unit", "total"]),
  notes: z.string().optional()
})

export const saleSchema = z.object({
  warehouseId: z.string().min(1, "Selecciona una bodega"),
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
  unitPrice: z.number().min(0, "El precio debe ser positivo"),
  paymentType: z.enum(["cash", "credit", "mixed"]),
  cashAmount: z.number().optional(),
  creditAmount: z.number().optional(),
  creditDays: z.number().int().min(1).optional(), // Días de crédito (requerido si es crédito o mixto)
  customerId: z.string().optional(),
  hasShipping: z.boolean().default(false),
  shippingCost: z.number().optional(),
  shippingPaidBy: z.enum(["seller", "customer"]).optional(),
  notes: z.string().optional()
}).refine((data) => {
  if (data.paymentType === "mixed") {
    return data.cashAmount !== undefined && 
           data.creditAmount !== undefined &&
           data.cashAmount + data.creditAmount === data.unitPrice * data.quantity
  }
  return true
}, {
  message: "En pago mixto, la suma debe igualar el total",
  path: ["cashAmount"]
}).refine((data) => {
  if (data.paymentType === "credit" || data.paymentType === "mixed") {
    return data.creditDays !== undefined && data.creditDays > 0
  }
  return true
}, {
  message: "Debes especificar los días de crédito",
  path: ["creditDays"]
})

export const customerSchema = z.object({
  name: z.string().min(1, "El nombre del cliente es requerido"),
  phone: z.string().optional(),
  address: z.string().optional()
})

export const alertConfigSchema = z.object({
  alertEmails: z.array(z.string().email("Email inválido")),
  enableAlerts: z.boolean()
})


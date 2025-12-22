export interface User {
  id: string
  email: string
  name: string
}

export interface Company {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Warehouse {
  id: string
  name: string
  companyId: string
  description?: string
}

export interface Product {
  id: string
  name: string
  nameLower: string
  description?: string
  imageBase64?: string
  companyId: string
  minStockThreshold: number
  stock?: Stock[]
}

export interface Stock {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  warehouse?: Warehouse
}

export interface Batch {
  id: string
  batchNumber: string
  productId: string
  warehouseId: string
  initialQuantity: number
  remainingQty: number
  unitCost: number
  purchaseDate: Date
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  companyId: string
}

export interface Movement {
  id: string
  movementNumber: string
  type: "purchase" | "sale"
  productId: string
  warehouseId: string
  batchId?: string
  quantity: number
  unitPrice: number
  totalAmount: number
  paymentType: "cash" | "credit" | "mixed"
  cashAmount?: number
  creditAmount?: number
  creditDays?: number
  creditPaid: boolean
  hasShipping: boolean
  shippingCost?: number
  shippingPaidBy?: "seller" | "customer"
  customerId?: string
  unitCost?: number
  profit?: number
  notes?: string
  movementDate: Date
  product?: Product
  warehouse?: Warehouse
  customer?: Customer
  batch?: Batch
}

export interface AlertConfig {
  id: string
  companyId: string
  alertEmails: string[]
  enableAlerts: boolean
}

// Exportar tipos de contactos
export * from './contacts'


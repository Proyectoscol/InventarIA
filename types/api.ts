export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SalesReport {
  movements: any[]
  totalAmount: number
  cashAmount: number
  creditAmount: number
  pendingCredit: number
  totalQuantity: number
  count: number
  byDay: Array<{
    date: string
    amount: number
  }>
}

export interface ProfitReport {
  totalRevenue: number
  totalCost: number
  netProfit: number
  margin: number
  topProducts: Array<{
    productId: string
    productName: string
    profit: number
    quantity: number
  }>
  topWarehouses: Array<{
    warehouseId: string
    warehouseName: string
    profit: number
    revenue: number
  }>
}


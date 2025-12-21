"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface ProfitChartProps {
  data: Array<{
    productName: string
    profit: number
    quantity: number
  }>
}

export function ProfitChart({ data }: ProfitChartProps) {
  const chartData = data.slice(0, 10).map(p => ({
    name: p.productName.length > 15 
      ? p.productName.substring(0, 15) + "..." 
      : p.productName,
    profit: p.profit
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Top 10 Productos por Ganancia</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
            />
            <Bar dataKey="profit" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


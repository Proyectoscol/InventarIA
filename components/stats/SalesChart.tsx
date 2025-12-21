"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

interface SalesChartProps {
  data: Array<{ date: string; amount: number }>
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map(d => ({
    date: format(new Date(d.date), "dd/MM"),
    amount: d.amount
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por Día</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#8884d8" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


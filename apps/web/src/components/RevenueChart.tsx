'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  revenue: {
    label: 'Revenue (฿)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

interface RevenueChartProps {
  data: any[]
  dataKey: string
}

export function RevenueChart({ data, dataKey }: RevenueChartProps) {
  const formatCurrency = (value: number) => `฿${value.toLocaleString()}`

  return (
    <div className="pt-4">
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
            dataKey={dataKey}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            />
            <YAxis
            tickFormatter={(value) => `฿${Number(value) / 1000}k`}
            tickLine={false}
            axisLine={false}
            width={80}
            />
            <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        </BarChart>
        </ChartContainer>
    </div>
  )
}

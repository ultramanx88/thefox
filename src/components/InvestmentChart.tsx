'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  earnings: {
    label: 'Earnings (฿)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

interface InvestmentChartProps {
  data: { investorName: string; earnings: number }[]
}

export function InvestmentChart({ data }: InvestmentChartProps) {
  const formatCurrency = (value: number) => `฿${value.toLocaleString()}`

  return (
    <div className="pt-4">
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
        <BarChart 
            accessibilityLayer 
            data={data}
            layout="vertical"
            margin={{
                left: 10,
            }}
        >
            <CartesianGrid horizontal={false} />
            <YAxis
                dataKey="investorName"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={120}
                className="text-xs"
            />
            <XAxis 
                type="number" 
                dataKey="earnings"
                tickFormatter={(value) => `฿${Number(value) / 1000}k`}
                axisLine={false}
                tickLine={false}
            />
            <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent 
                formatter={(value, name) => `${(name as string).charAt(0).toUpperCase() + (name as string).slice(1)}: ${formatCurrency(Number(value))}`}
                labelFormatter={() => ''}
            />}
            />
            <Bar dataKey="earnings" layout="vertical" fill="var(--color-earnings)" radius={4} />
        </BarChart>
        </ChartContainer>
    </div>
  )
}

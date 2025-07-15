"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { MonthlySalesData } from "@/actions/reportsActions"

interface MonthlySalesChartProps {
  data: MonthlySalesData[];
}

export function MonthlySalesChart({ data }: MonthlySalesChartProps) {
    if (!data || data.length === 0) {
        return (
             <div className="h-64 bg-muted/50 rounded-md flex items-center justify-center border border-border">
                <p className="text-muted-foreground">Not enough sales data to display a chart yet.</p>
            </div>
        )
    }

  const chartConfig = {
    total: {
      label: "Sales",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          stroke="#888888"
          fontSize={12}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${Number(value) > 999 ? `${Number(value) / 1000}k` : value}`}
        />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent
            formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
            indicator="dot"
           />}
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

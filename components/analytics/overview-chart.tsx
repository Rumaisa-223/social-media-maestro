"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function OverviewChart() {
  const [data, setData] = useState<any[]>([
    { date: "Jan", instagram: 120, twitter: 220, facebook: 150 },
    { date: "Feb", instagram: 132, twitter: 182, facebook: 232 },
    { date: "Mar", instagram: 101, twitter: 191, facebook: 201 },
    { date: "Apr", instagram: 134, twitter: 234, facebook: 154 },
    { date: "May", instagram: 90, twitter: 290, facebook: 190 },
    { date: "Jun", instagram: 230, twitter: 330, facebook: 330 },
    { date: "Jul", instagram: 210, twitter: 310, facebook: 410 },
  ])
  useEffect(() => {
    let mounted = true
    fetch("/api/analytics").then(async (r) => {
      const d = await r.json()
      if (!mounted) return
      const s = d?.series || {}
      const platforms = ["instagram", "twitter", "facebook"]
      const dateSet = new Set<string>()
      platforms.forEach((p) => {
        (s[p] || []).forEach((e: any) => dateSet.add(String(e.date)))
      })
      const dates = Array.from(dateSet).sort()
      if (dates.length) {
        const rows = dates.map((date) => {
          const row: any = { date }
          platforms.forEach((p) => {
            const found = (s[p] || []).find((e: any) => e.date === date)
            row[p] = Number(found?.value || 0)
          })
          return row
        })
        setData(rows)
      }
    }).catch(() => {})
    return () => { mounted = false }
  }, [])
  return (
    <ChartContainer
      config={{
        instagram: {
          label: "Instagram",
          color: "hsl(var(--chart-1))",
        },
        twitter: {
          label: "Twitter",
          color: "hsl(var(--chart-2))",
        },
        facebook: {
          label: "Facebook",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <XAxis
            dataKey="date"
            stroke="hsl(var(--border))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--border))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `${value}`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="instagram" stroke="var(--color-instagram)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="twitter" stroke="var(--color-twitter)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="facebook" stroke="var(--color-facebook)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

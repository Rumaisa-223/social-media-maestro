"use client"

import { useEffect, useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

type Slice = { name: string; value: number; color: string }

export function EngagementBreakdown() {
  const [data, setData] = useState<Slice[]>([
    { name: "Likes", value: 48, color: "#4f46e5" },
    { name: "Comments", value: 22, color: "#10b981" },
    { name: "Shares", value: 15, color: "#f59e0b" },
    { name: "Saves", value: 10, color: "#ef4444" },
    { name: "Profile Visits", value: 5, color: "#6b7280" },
  ])
  useEffect(() => {
    let mounted = true
    fetch("/api/analytics").then(async (r) => {
      const d = await r.json()
      if (!mounted) return
      const b = d?.breakdown || { likes: 0, comments: 0, shares: 0, saves: 0, profile_visits: 0 }
      const values = Object.values(b as Record<string, number>).map((x) => Number(x || 0))
      const total = values.reduce((sum, val) => sum + val, 0) || 1
      const pct = (v?: number) => Math.round(((Number(v || 0)) / total) * 100)
      setData([
        { name: "Likes", value: pct(b.likes), color: "#4f46e5" },
        { name: "Comments", value: pct(b.comments), color: "#10b981" },
        { name: "Shares", value: pct(b.shares), color: "#f59e0b" },
        { name: "Saves", value: pct(b.saves), color: "#ef4444" },
        { name: "Profile Visits", value: pct(b.profile_visits), color: "#6b7280" },
      ])
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <div className="h-[300px] flex flex-col">
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}%`, "Percentage"]}
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

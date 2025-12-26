"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { name: "Mon", engagement: 2400, reach: 2400, conversions: 240 },
  { name: "Tue", engagement: 3000, reach: 1398, conversions: 221 },
  { name: "Wed", engagement: 2000, reach: 9800, conversions: 229 },
  { name: "Thu", engagement: 2780, reach: 3908, conversions: 200 },
  { name: "Fri", engagement: 1890, reach: 4800, conversions: 221 },
  { name: "Sat", engagement: 2390, reach: 3800, conversions: 250 },
  { name: "Sun", engagement: 3490, reach: 4300, conversions: 210 },
]

export function DashboardChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="engagement" stroke="#3b82f6" strokeWidth={2} />
        <Line type="monotone" dataKey="reach" stroke="#10b981" strokeWidth={2} />
        <Line type="monotone" dataKey="conversions" stroke="#f59e0b" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

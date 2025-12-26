"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, CheckCircle2, Calendar } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

interface OptimizeTimingDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
}

export function OptimizeTimingDialog({ open, onOpenChangeAction }: OptimizeTimingDialogProps) {
  const [selectedTime, setSelectedTime] = useState("7-9 PM")

  // Peak engagement data
  const engagementData = [
    { time: "6 AM", engagement: 12 },
    { time: "9 AM", engagement: 28 },
    { time: "12 PM", engagement: 35 },
    { time: "3 PM", engagement: 42 },
    { time: "6 PM", engagement: 58 },
    { time: "7 PM", engagement: 78 },
    { time: "8 PM", engagement: 85 },
    { time: "9 PM", engagement: 72 },
    { time: "10 PM", engagement: 45 },
  ]

  // Rescheduling impact
  const impactData = [
    { week: "Week 1", current: 2400, optimized: 3100 },
    { week: "Week 2", current: 2210, optimized: 3200 },
    { week: "Week 3", current: 2290, optimized: 3300 },
    { week: "Week 4", current: 2000, optimized: 3100 },
  ]

  const timeSlots = [
    { label: "6-8 AM", engagement: 20, improvement: "5%" },
    { label: "12-2 PM", engagement: 37, improvement: "12%" },
    { label: "5-7 PM", engagement: 68, improvement: "24%" },
    { label: "7-9 PM", engagement: 78, improvement: "28%", peak: true },
    { label: "9-11 PM", engagement: 58, improvement: "18%" },
  ]

  const handleApply = async () => {
    console.log("Applying timing optimization for:", selectedTime)
    // API call to reschedule posts
    onOpenChangeAction(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl mb-1">Optimize Post Timing</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                    Engagement
                  </Badge>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">28% higher engagement</span>
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={() => onOpenChangeAction(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Peak Hours Chart */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Your Audience Activity Pattern</h3>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="time" stroke="currentColor" opacity={0.6} />
                  <YAxis stroke="currentColor" opacity={0.6} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="engagement" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
              Your audience is most active between{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">7-9 PM</span>
            </p>
          </div>

          {/* Time Slot Options */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Recommended Time Slots</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot.label}
                  onClick={() => setSelectedTime(slot.label)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTime === slot.label
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{slot.label}</span>
                    {slot.peak && (
                      <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-0">
                        Peak
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{slot.engagement}% engagement</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{slot.improvement}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Projected Impact */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Projected 4-Week Impact</h3>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={impactData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="week" stroke="currentColor" opacity={0.6} />
                  <YAxis stroke="currentColor" opacity={0.6} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="current" stroke="#94a3b8" strokeWidth={2} name="Current Schedule" />
                  <Line
                    type="monotone"
                    dataKey="optimized"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Optimized Schedule"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">What You'll Get</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">28% increase in engagement rates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">Automatic post rescheduling to peak hours</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  Real-time notifications for best posting times
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleApply} className="flex-1">
              Apply to {selectedTime}
            </Button>
            <Button variant="outline" onClick={() => onOpenChangeAction(false)} className="flex-1">
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

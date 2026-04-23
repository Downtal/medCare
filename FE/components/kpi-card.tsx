import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface KPICardProps {
  title: string
  value: string
  change?: string
  icon: LucideIcon
  trend?: "up" | "down"
}

export function KPICard({ title, value, change, icon: Icon, trend }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p
            className={`text-xs mt-1 ${
              trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

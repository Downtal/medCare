"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getApiBaseUrl } from "@/lib/config"
import {
  Activity,
  Scale,
  Ruler,
  AlertCircle,
  TrendingUp,
  Clock,
  Plus,
  ChevronRight,
  Info,
  History,
  ShieldAlert
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export default function HealthDashboard() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<any[]>([])
  const [healthNote, setHealthNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [newMetric, setNewMetric] = useState({ 
    weight: '', 
    height: '', 
    allergies: '', 
    chronicConditions: '' 
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchData()
    }
  }, [session?.user?.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const headers = {
        'Authorization': `Bearer ${session?.user?.accessToken}`,
        'X-User-Id': session?.user?.id?.toString() || ''
      }

      const [metricsRes, noteRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me/metrics`, { headers }),
        fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me/health-notes`, { headers })
      ])

      if (metricsRes.ok) {
        const data = await metricsRes.json().catch(() => [])
        setMetrics(data)
      }

      if (noteRes.ok) {
        const text = await noteRes.text()
        if (text) {
          try {
            setHealthNote(JSON.parse(text))
          } catch (e) {
            console.error("Failed to parse health note JSON", e)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch health data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const promises = []
      const headers = { 
        'Authorization': `Bearer ${session?.user?.accessToken}`,
        'Content-Type': 'application/json'
      }

      // 1. Update Weight if provided
      if (newMetric.weight) {
        promises.push(fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me/metrics`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'WEIGHT',
            value: parseFloat(newMetric.weight),
            unit: 'kg'
          })
        }))
      }

      // 2. Update Height if provided
      if (newMetric.height) {
        promises.push(fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me/metrics`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'HEIGHT',
            value: parseFloat(newMetric.height),
            unit: 'cm'
          })
        }))
      }

      // 3. Update Health Notes if provided
      if (newMetric.allergies || newMetric.chronicConditions) {
        promises.push(fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me/health-notes`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            allergies: newMetric.allergies || healthNote?.allergies,
            chronicConditions: newMetric.chronicConditions || healthNote?.chronicConditions
          })
        }))
      }

      const results = await Promise.all(promises)
      const allOk = results.every(r => r.ok)

      if (allOk) {
        toast.success("Cập nhật thông tin sức khỏe thành công!")
        setIsUpdateModalOpen(false)
        fetchData()
        setNewMetric({ weight: '', height: '', allergies: '', chronicConditions: '' })
      } else {
        toast.error("Có lỗi xảy ra khi cập nhật một số thông tin")
      }
    } catch (error) {
      toast.error("Không thể kết nối tới máy chủ")
    } finally {
      setSaving(false)
    }
  }

  // Prepare chart data
  const weightData = metrics
    .filter(m => m.type === 'WEIGHT')
    .reverse()
    .map(m => ({
      date: format(new Date(m.recordedAt), 'dd/MM'),
      value: m.value
    }))

  const currentWeight = metrics.find(m => m.type === 'WEIGHT')?.value || '--'
  const currentHeight = metrics.find(m => m.type === 'HEIGHT')?.value || '--'

  // Calculate BMI if data exists
  const bmi = (currentWeight && currentHeight)
    ? (currentWeight / ((currentHeight / 100) ** 2)).toFixed(1)
    : '--'

  const getBmiStatus = (val: string) => {
    const v = parseFloat(val)
    if (v < 18.5) return { label: "Cân nặng thấp", color: "text-blue-500", bg: "bg-blue-50" }
    if (v < 24.9) return { label: "Bình thường", color: "text-green-500", bg: "bg-green-50" }
    if (v < 29.9) return { label: "Tiền béo phì", color: "text-amber-500", bg: "bg-amber-50" }
    return { label: "Béo phì", color: "text-red-500", bg: "bg-red-50" }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sức khỏe của tôi</h1>
          <p className="text-slate-500 font-medium">Theo dõi chỉ số sức khỏe cá nhân của bạn</p>
        </div>
        <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />Cập nhật chỉ số
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Cập nhật thông tin sức khỏe</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateMetric} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Cân nặng (kg)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="VD: 65.5" 
                    className="h-12 rounded-xl"
                    value={newMetric.weight}
                    onChange={(e) => setNewMetric({ ...newMetric, weight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Chiều cao (cm)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="VD: 170" 
                    className="h-12 rounded-xl"
                    value={newMetric.height}
                    onChange={(e) => setNewMetric({ ...newMetric, height: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Dị ứng (nếu có)</Label>
                <Input 
                  placeholder="VD: Hải sản, Phấn hoa..." 
                  className="h-12 rounded-xl"
                  value={newMetric.allergies}
                  onChange={(e) => setNewMetric({ ...newMetric, allergies: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Tình trạng bệnh lý / Mãn tính</Label>
                <Input 
                  placeholder="VD: Huyết áp cao, Tiểu đường..." 
                  className="h-12 rounded-xl"
                  value={newMetric.chronicConditions}
                  onChange={(e) => setNewMetric({ ...newMetric, chronicConditions: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 font-medium">Nhập "Bình thường" nếu không có bệnh lý.</p>
              </div>

              <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu tất cả thay đổi
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
      >
        <MetricCard
          icon={Activity}
          label="Chỉ số BMI"
          value={bmi}
          unit=""
          status={bmi !== '--' ? getBmiStatus(bmi) : undefined}
          color="bg-indigo-500"
        />
        <MetricCard
          icon={Scale}
          label="Cân nặng"
          value={currentWeight}
          unit="kg"
          color="bg-emerald-500"
        />
        <MetricCard
          icon={Ruler}
          label="Chiều cao"
          value={currentHeight}
          unit="cm"
          color="bg-sky-500"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Dị ứng"
          value={healthNote?.allergies?.split(',').filter(Boolean).length || 0}
          unit="loại"
          color="bg-rose-500"
          desc={healthNote?.allergies || "Không có dữ liệu dị ứng"}
        />
        <MetricCard
          icon={Clock}
          label="Tình trạng"
          value={healthNote?.chronicConditions ? "CÓ" : "ỔN ĐỊNH"}
          unit=""
          color="bg-amber-500"
          desc={healthNote?.chronicConditions || "Bình thường"}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 gap-8"
      >
        {/* Trend Chart */}
        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
          <CardHeader className="p-8 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Xu hướng cân nặng</CardTitle>
                <CardDescription className="font-medium">Dữ liệu 10 lần cập nhật gần nhất</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 h-[350px]">
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    hide
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 800, color: '#10B981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#10B981', strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <History className="w-12 h-12 mb-2 opacity-20" />
                <p className="font-bold">Chưa có dữ liệu lịch sử</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Medical History Timeline (Optional Placeholder) */}
      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
        <CardHeader className="p-8">
          <CardTitle className="text-xl font-black">Lịch sử Sức khỏe & Hoạt động</CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {metrics.slice(0, 5).map((m, i) => (
              <div key={m.id} className="relative pl-10">
                <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-primary shadow-sm z-10" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-800">
                      Cập nhật {m.type === 'WEIGHT' ? 'Cân nặng' : 'Chiều cao'}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      Giá trị: {m.value} {m.unit}
                    </p>
                  </div>
                  <time className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {format(new Date(m.recordedAt), 'eeee, dd MMMM yyyy', { locale: vi })}
                  </time>
                </div>
              </div>
            ))}
            {metrics.length === 0 && (
              <p className="text-center py-10 text-slate-400 font-bold">Chưa có hoạt động sức khỏe nào được ghi nhận.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, unit, status, color, desc }: any) {
  return (
    <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
            <Icon className="w-6 h-6" />
          </div>
          {status && (
            <Badge className={cn("rounded-full px-3 py-1 font-bold border-none", status.bg, status.color)}>
              {status.label}
            </Badge>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900">{value}</span>
            <span className="text-sm font-bold text-slate-400">{unit}</span>
          </div>
          {desc && (
            <p className="text-xs font-medium text-slate-400 mt-2 line-clamp-1 italic">
              {desc}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}

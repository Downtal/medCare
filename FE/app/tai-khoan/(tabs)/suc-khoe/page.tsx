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
  Brain, 
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
  const [analysis, setAnalysis] = useState<any>(null)
  const [healthNote, setHealthNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [newMetric, setNewMetric] = useState({ type: 'WEIGHT', value: '', unit: 'kg' })

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
      
      const [metricsRes, analysisRes, noteRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me/metrics`, { headers }),
        fetch(`${getApiBaseUrl()}/ai-service/api/ai/recommendations/history-analysis`, { headers }),
        fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me/health-notes`, { headers })
      ])

      if (metricsRes.ok) setMetrics(await metricsRes.json())
      if (analysisRes.ok) setAnalysis(await analysisRes.json())
      if (noteRes.ok) setHealthNote(await noteRes.json())
    } catch (error) {
      console.error("Failed to fetch health data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me/metrics`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.user?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: newMetric.type,
          value: parseFloat(newMetric.value),
          unit: newMetric.unit
        })
      })

      if (res.ok) {
        toast.success("Cập nhật chỉ số thành công!")
        setIsUpdateModalOpen(false)
        fetchData()
      }
    } catch (error) {
      toast.error("Không thể cập nhật chỉ số")
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
    ? (currentWeight / ((currentHeight/100) ** 2)).toFixed(1)
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
          <p className="text-slate-500 font-medium">Theo dõi chỉ số và nhận phân tích thông minh từ MedCare AI</p>
        </div>
        <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> Cập nhật chỉ số
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Cập nhật chỉ số sức khỏe</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateMetric} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label className="font-bold">Loại chỉ số</Label>
                <select 
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 bg-slate-50 font-medium outline-none focus:border-primary"
                  value={newMetric.type}
                  onChange={(e) => {
                    const type = e.target.value
                    setNewMetric({ ...newMetric, type, unit: type === 'WEIGHT' ? 'kg' : 'cm' })
                  }}
                >
                  <option value="WEIGHT">Cân nặng (kg)</option>
                  <option value="HEIGHT">Chiều cao (cm)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Giá trị ({newMetric.unit})</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  placeholder="Ví dụ: 65.5" 
                  className="h-12 rounded-xl"
                  value={newMetric.value}
                  onChange={(e) => setNewMetric({ ...newMetric, value: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold">Lưu chỉ số</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
          value={healthNote?.allergies?.split(',').length || 0} 
          unit="loại" 
          color="bg-rose-500"
          desc={healthNote?.allergies || "Không có dữ liệu dị ứng"}
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Trend Chart */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-sm overflow-hidden">
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

        {/* AI Health Analysis */}
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10" />
          <CardHeader className="p-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-black">AI Health Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6 relative z-10">
            {analysis ? (
              <>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-sm text-white/80 leading-relaxed italic">
                    "{analysis.summary}"
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest">Cảnh báo thói quen</h4>
                  {analysis.habit_alerts?.map((alert: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-white/90">{alert}</p>
                    </div>
                  ))}
                  {(!analysis.habit_alerts || analysis.habit_alerts.length === 0) && (
                    <p className="text-xs text-white/40">Không phát hiện thói quen bất thường.</p>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-white/60">Tình trạng:</span>
                  <Badge className={cn(
                    "rounded-full px-3 py-1 font-black",
                    analysis.health_status === 'STABLE' ? "bg-emerald-500/20 text-emerald-400" :
                    analysis.health_status === 'CAUTION' ? "bg-amber-500/20 text-amber-400" :
                    "bg-rose-500/20 text-rose-400"
                  )}>
                    {analysis.health_status}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-white/40">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-xs font-bold">Đang phân tích bệnh sử...</p>
              </div>
            )}
            
            <div className="p-3 bg-white/5 rounded-xl flex items-start gap-2">
              <Info className="w-3 h-3 text-white/40 shrink-0 mt-0.5" />
              <p className="text-[10px] text-white/40 leading-tight">
                Phân tích dựa trên dữ liệu mua sắm và chỉ số cá nhân. Luôn tham khảo ý kiến chuyên gia y tế.
              </p>
            </div>
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

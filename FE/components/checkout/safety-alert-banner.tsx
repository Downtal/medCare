"use client"

import { AlertCircle, ShieldCheck, ShieldAlert, Info, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

interface SafetyAlertProps {
  riskLevel: "NONE" | "LOW" | "HIGH"
  message: string
  requiresConfirmation: boolean
  onConfirmChange?: (checked: boolean) => void
}

export function SafetyAlertBanner({ 
  riskLevel, 
  message, 
  requiresConfirmation, 
  onConfirmChange 
}: SafetyAlertProps) {
  
  if (riskLevel === "NONE") return (
    <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-medium">
      <ShieldCheck className="w-4 h-4" />
      <span>Hệ thống đã kiểm tra: Giỏ hàng của bạn an toàn.</span>
    </div>
  )

  const isHigh = riskLevel === "HIGH"

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Alert className={`rounded-2xl border-2 ${
          isHigh ? "border-rose-200 bg-rose-50 animate-shake" : "border-amber-100 bg-amber-50"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`mt-1 p-2 rounded-xl ${
              isHigh ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
            }`}>
              {isHigh ? <ShieldAlert className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <AlertTitle className={`font-black text-lg ${
                isHigh ? "text-rose-900" : "text-amber-900"
              }`}>
                {isHigh ? "Cảnh báo An toàn Quan trọng" : "Lưu ý về Tương tác thuốc"}
              </AlertTitle>
              <AlertDescription className={`mt-1 font-medium leading-relaxed ${
                isHigh ? "text-rose-800" : "text-amber-800"
              }`}>
                {message}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {requiresConfirmation && (
          <motion.div 
            className="p-4 bg-white rounded-2xl border-2 border-rose-100 flex items-start gap-3 shadow-sm"
            whileHover={{ scale: 1.01 }}
          >
            <Checkbox 
              id="safety-confirm" 
              className="mt-1 border-rose-300 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
              onCheckedChange={(checked) => onConfirmChange?.(checked === true)}
            />
            <Label 
              htmlFor="safety-confirm" 
              className="text-sm font-bold text-slate-700 leading-snug cursor-pointer"
            >
              Tôi xác nhận đã tham khảo ý kiến bác sĩ/dược sĩ về các loại thuốc này và hoàn toàn chịu trách nhiệm về quyết định mua hàng.
            </Label>
          </motion.div>
        )}
        
        <div className="flex items-center gap-2 px-2">
          <Info className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Phân tích bởi MedCare AI Clinical Pharmacist
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

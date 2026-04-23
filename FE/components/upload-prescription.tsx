"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, FileText, XCircle, Clock, AlertCircle } from "lucide-react"

interface PrescriptionUploadProps {
  onUploadComplete?: (prescriptionId: string) => void
}

export function UploadPrescription({ onUploadComplete }: PrescriptionUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [note, setNote] = useState("")
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    setUploading(true)
    // Simulate upload
    setTimeout(() => {
      setUploading(false)
      onUploadComplete?.("RX-" + Math.random().toString(36).substr(2, 9).toUpperCase())
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Tải lên đơn thuốc
        </CardTitle>
        <CardDescription>Vui lòng chụp ảnh hoặc tải lên đơn thuốc của bác sĩ để dược sĩ xác nhận</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Guidelines */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Hướng dẫn chụp toa thuốc hợp lệ:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Chụp rõ nét, đầy đủ thông tin trên toa</li>
              <li>Bao gồm tên bệnh nhân, chẩn đoán, chữ ký bác sĩ</li>
              <li>Toa còn hiệu lực (trong vòng 30 ngày)</li>
              <li>Định dạng: JPG, PNG, PDF (tối đa 5MB)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Upload Area */}
        <div className="space-y-4">
          <Label>Ảnh toa thuốc *</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
            <Input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="prescription-upload"
            />
            <label htmlFor="prescription-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium mb-1">Nhấn để tải ảnh lên</p>
                  <p className="text-sm text-muted-foreground">hoặc kéo thả file vào đây</p>
                </div>
                <Button type="button" variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Chụp ảnh
                </Button>
              </div>
            </label>
          </div>

          {/* Preview */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFiles(files.filter((_, i) => i !== idx))}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="space-y-2">
          <Label htmlFor="note">Ghi chú cho dược sĩ (tùy chọn)</Label>
          <Textarea
            id="note"
            placeholder="Ví dụ: Bác sĩ kê cho đau dạ dày, cần tư vấn thêm về cách dùng..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button onClick={handleUpload} disabled={files.length === 0 || uploading} className="flex-1" size="lg">
            {uploading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Gửi đơn thuốc
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useCallback, useState, useImperativeHandle, forwardRef } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Loader2, X, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface ProductImage {
  imageUrl: string
  isPrimary: boolean
  sortOrder: number
}

interface MultiImageUploadProps {
  value: ProductImage[]
  onChange: (value: ProductImage[]) => void
}

export interface MultiImageUploadRef {
  uploadPendingFiles: () => Promise<void>
  hasPendingFiles: boolean
}

export const MultiImageUpload = forwardRef<MultiImageUploadRef, MultiImageUploadProps>(
  ({ value = [], onChange }, ref) => {
    const [isUploading, setIsUploading] = useState(false)
    const [pendingFiles, setPendingFiles] = useState<File[]>([])

    const handleUpload = async () => {
      if (pendingFiles.length === 0) return
      
      setIsUploading(true)
      try {
        const uploadPromises = pendingFiles.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: "POST",
              body: formData,
            }
          )

          const data = await response.json()
          if (data.secure_url) {
            return {
              imageUrl: data.secure_url,
              isPrimary: value.length === 0,
              sortOrder: value.length,
            }
          }
          throw new Error(data.error?.message || "Upload failed")
        })

        const newImages = await Promise.all(uploadPromises)
        onChange([...value, ...newImages])
        setPendingFiles([])
        toast.success(`Đã tải lên ${newImages.length} ảnh thành công`)
      } catch (error) {
        console.error("Cloudinary upload error:", error)
        toast.error("Lỗi khi tải ảnh lên Cloudinary")
        throw error // Re-throw to prevent save
      } finally {
        setIsUploading(false)
      }
    }

    useImperativeHandle(ref, () => ({
      uploadPendingFiles: handleUpload,
      hasPendingFiles: pendingFiles.length > 0
    }))

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        setPendingFiles(prev => [...prev, ...acceptedFiles])
      },
      []
    )

    const removePending = (index: number) => {
      setPendingFiles(prev => prev.filter((_, i) => i !== index))
    }

    const removeImage = (url: string) => {
      const updated = value.filter((img) => img.imageUrl !== url)
      if (updated.length > 0 && !updated.some(img => img.isPrimary)) {
        updated[0].isPrimary = true
      }
      onChange(updated)
    }

    const setPrimary = (url: string) => {
      const updated = value.map((img) => ({
        ...img,
        isPrimary: img.imageUrl === url,
      }))
      onChange(updated)
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { "image/*": [] },
      disabled: isUploading,
    })

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {value.map((image, index) => (
            <div
              key={image.imageUrl}
              className="group relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm transition-all hover:shadow-md"
            >
              <Image
                src={image.imageUrl}
                alt="product"
                fill
                sizes="112px"
                className="h-full w-full object-contain"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={() => setPrimary(image.imageUrl)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-lg",
                    image.isPrimary 
                      ? "bg-emerald-500 text-white" 
                      : "bg-white text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {image.isPrimary ? (
                    <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Ảnh chính</span>
                  ) : (
                    "Làm ảnh chính"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(image.imageUrl)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all text-[9px] font-black uppercase tracking-wider shadow-lg"
                >
                  <X className="h-3 w-3" /> Gỡ bỏ
                </button>
              </div>
            </div>
          ))}

          {pendingFiles.map((file, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-xl border border-dashed border-blue-300 overflow-hidden bg-blue-50/30 flex items-center justify-center"
            >
              <img
                src={URL.createObjectURL(file)}
                alt="pending"
                className="h-full w-full object-contain opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                <span className="bg-white/90 text-blue-600 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-blue-200 shadow-sm animate-pulse"></span>
              </div>
              <button
                type="button"
                onClick={() => removePending(index)}
                className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-rose-500 hover:bg-rose-50 shadow-sm border border-slate-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          <div
            {...getRootProps()}
            className={cn(
              "group relative aspect-square rounded-xl border-2 border-dashed border-slate-200 transition-all hover:border-primary hover:bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer",
              isDragActive && "border-primary bg-primary/5",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Plus className="h-5 w-5 text-slate-400" />}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thêm ảnh</span>
          </div>
        </div>

        {pendingFiles.length > 0 && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest h-10 rounded-xl shadow-lg shadow-blue-100"
          >
            {isUploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải {pendingFiles.length} ảnh...</>
            ) : (
              <>Xác nhận tải lên ({pendingFiles.length} ảnh)</>
            )}
          </Button>
        )}

        <p className="text-[11px] text-muted-foreground italic leading-relaxed max-w-full break-words mt-4">
          * Kéo thả hoặc click để chọn nhiều ảnh. Ảnh đầu tiên (hoặc được chọn) sẽ là thumbnail.
        </p>
      </div>
    )
  }
)

MultiImageUpload.displayName = "MultiImageUpload"

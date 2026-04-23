"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { ImagePlus, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    // Cloud name and Preset from Env
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "medcare"
    
    formData.append("upload_preset", uploadPreset)

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      )
      
      const data = await response.json()
      
      if (data.secure_url) {
        onChange(data.secure_url)
        toast.success("Tải ảnh thành công")
      } else {
        throw new Error(data.error?.message || "Upload failed")
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error)
      toast.error("Không thể tải ảnh. Vui lòng thử lại.")
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  })

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full aspect-square max-h-[250px] rounded-xl overflow-hidden group border bg-white shadow-sm flex items-center justify-center p-2">
          <Image
            src={value}
            alt="Product image"
            fill
            className="object-contain"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-transform scale-90 group-hover:scale-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"}
            ${isUploading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Đang tải lên...</p>
            </div>
          ) : (
             <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-full">
                <ImagePlus className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Kéo thả ảnh hoặc click để tải lên</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP (Tối đa 5MB)</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

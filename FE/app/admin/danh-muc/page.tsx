"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LayoutGrid, Plus, Edit, Trash, ChevronRight, ChevronDown, Folder, File, RotateCcw, XCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { productService } from "@/services/productService"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Category {
  id: number
  name: string
  parentId?: number | null
  children?: Category[]
  deletedAt?: string | null
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("active")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    parentId: "" as string | number
  })

  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false)
  const [categorySelected, setCategorySelected] = useState<number | null>(null)

  const { data: categoryTree = [], isLoading: isLoadingTree } = useQuery({
    queryKey: ["admin_category_tree"],
    queryFn: () => productService.getCategoryTree()
  })

  const { data: trashedCategories = [], isLoading: isLoadingTrash } = useQuery({
    queryKey: ["admin_trashed_categories"],
    queryFn: () => productService.getTrashedCategories(),
    enabled: activeTab === "trash"
  })

  // Flat list for parent selection
  const parentCategories = categoryTree.map((c: any) => ({ id: c.id, name: c.name }))

  const toggleExpand = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        name: data.name,
        parentId: data.parentId === "" ? null : Number(data.parentId)
      }
      if (editingCategory) {
        return productService.updateCategory(editingCategory.id, payload)
      }
      return productService.createCategory(payload)
    },
    onSuccess: () => {
      toast.success(editingCategory ? "Đã cập nhật danh mục" : "Đã thêm danh mục mới")
      queryClient.invalidateQueries({ queryKey: ["admin_category_tree"] })
      setIsDialogOpen(false)
      setFormData({ name: "", parentId: "" })
    },
    onError: () => toast.error("Đã xảy ra lỗi")
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.deleteCategory(id),
    onSuccess: () => {
      toast.success("Đã đưa vào thùng rác")
      queryClient.invalidateQueries({ queryKey: ["admin_category_tree"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_categories"] })
      setIsDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa.")
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => productService.restoreCategory(id),
    onSuccess: () => {
      toast.success("Đã khôi phục danh mục")
      queryClient.invalidateQueries({ queryKey: ["admin_category_tree"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_categories"] })
      setIsRestoreDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi khôi phục.")
  })

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => productService.hardDeleteCategory(id),
    onSuccess: () => {
      toast.success("Đã xóa vĩnh viễn")
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_categories"] })
      setIsHardDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa vĩnh viễn.")
  })

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expanded[category.id]
    const hasChildren = category.children && category.children.length > 0

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-100 group transition-colors ${level > 0 ? "ml-8" : "bg-white"}`}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button onClick={() => toggleExpand(category.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>
            ) : (
              <div className="w-6" /> // spacer
            )}

            <div className={`p-2 rounded-lg ${level === 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
              {level === 0 ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
            </div>

            <div className="flex flex-col">
              <span className={`font-bold ${level === 0 ? "text-slate-800 text-base" : "text-slate-600 text-sm"}`}>
                {category.name}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {level === 0 ? "Danh mục cấp 1" : "Danh mục cấp 2"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
              onClick={() => {
                setEditingCategory(category)
                setFormData({ name: category.name, parentId: category.parentId || "" })
                setIsDialogOpen(true)
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:bg-rose-50"
              onClick={() => {
                setCategorySelected(category.id)
                setIsDeleteDialogOpen(true)
              }}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l-2 border-slate-100 ml-6">
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-10 space-y-8 max-w-[1200px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
            <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
              <TabsTrigger value="active" className="rounded-xl font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">Cấu trúc</TabsTrigger>
              <TabsTrigger value="trash" className="rounded-xl font-bold px-6 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600 data-[state=active]:shadow-sm text-sm">Thùng rác</TabsTrigger>
            </TabsList>
          </Tabs>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === "active" ? "Cấu trúc Danh mục" : "Thùng rác Danh mục"}
            </h1>
            <p className="text-slate-500 font-medium">
              {activeTab === "active" ? "Phân cấp sản phẩm Medicine theo 2 tầng" : "Xem lại hoặc xóa vĩnh viễn các danh mục đã xóa tạm."}
            </p>
          </div>
        </div>
        
        {activeTab === "active" && (
          <Button className="h-12 px-6 bg-blue-600 font-bold rounded-2xl gap-2 shadow-xl shadow-blue-100" onClick={() => {
            setEditingCategory(null)
            setFormData({ name: "", parentId: "" })
            setIsDialogOpen(true)
          }}>
            <Plus className="w-5 h-5" /> Thêm danh mục
          </Button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {activeTab === "active" ? (
          isLoadingTree ? (
            <div className="p-20 text-center text-slate-400 font-medium italic">Đang tải cấu trúc dữ liệu...</div>
          ) : categoryTree.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-medium italic">Chưa có danh mục nào. Hãy tạo một Group cha trước.</div>
          ) : (
            categoryTree.map((c: any) => renderCategory(c))
          )
        ) : (
          isLoadingTrash ? (
            <div className="p-20 text-center text-slate-400 font-medium italic">Đang tải thùng rác...</div>
          ) : trashedCategories.length === 0 ? (
            <div className="p-20 text-center text-slate-400 font-medium italic text-sm">Thùng rác trống.</div>
          ) : (
            trashedCategories.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-4 hover:bg-rose-50/30 transition-colors group">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-rose-50 text-rose-400">
                      <Trash2 className="w-4 h-4" />
                   </div>
                   <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{c.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         Xóa lúc: {c.deletedAt ? new Date(c.deletedAt).toLocaleString("vi-VN") : "N/A"}
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => { setCategorySelected(c.id); setIsRestoreDialogOpen(true); }}
                   >
                      <RotateCcw className="w-4 h-4" />
                   </Button>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                    onClick={() => { setCategorySelected(c.id); setIsHardDeleteDialogOpen(true); }}
                   >
                      <XCircle className="w-4 h-4" />
                   </Button>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800">
              {editingCategory ? "Cập nhật danh mục" : "Tạo danh mục mới"}
            </DialogTitle>
            <DialogDescription>Nhập tên và chọn cấp bậc cho danh mục này.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Tên danh mục</label>
              <Input
                placeholder="VD: Thuốc Giảm Đau"
                className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-blue-100 font-bold"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Danh mục Cha (Để trống nếu là cấp 1)</label>
              <Select
                value={formData.parentId ? formData.parentId.toString() : "none"}
                onValueChange={v => setFormData({ ...formData, parentId: v === "none" ? "" : v })}
              >
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none">
                  <SelectValue placeholder="Chọn danh mục cha..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="none">(Không có - Là danh mục chính)</SelectItem>
                  {parentCategories.filter((pc: any) => pc.id !== editingCategory?.id).map((pc: any) => (
                    <SelectItem key={pc.id} value={pc.id.toString()}>{pc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl font-bold h-12" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button
              className="rounded-xl bg-blue-600 font-black h-12 px-8 flex-1 shadow-lg shadow-blue-100"
              disabled={!formData.name.trim() || mutation.isPending}
              onClick={() => mutation.mutate(formData)}
            >
              {editingCategory ? "CẬP NHẬT" : "TẠO DANH MỤC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialogs */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black tracking-tight">Bỏ vào thùng rác?</AlertDialogTitle>
            <AlertDialogDescription>
              Danh mục sẽ bị ẩn khỏi menu. Các danh mục con liên quan cũng sẽ bị đưa vào thùng rác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-orange-600 font-bold" onClick={() => categorySelected && deleteMutation.mutate(categorySelected)}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-emerald-600">Khôi phục danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Danh mục sẽ quay trở lại cấu trúc phân cấp ban đầu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-emerald-600 font-bold" onClick={() => categorySelected && restoreMutation.mutate(categorySelected)}>KHÔI PHỤC</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isHardDeleteDialogOpen} onOpenChange={setIsHardDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-rose-600">XÓA VĨNH VIỄN?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Toàn bộ dữ liệu về danh mục này sẽ bị xóa bỏ hoàn toàn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 font-black" onClick={() => categorySelected && hardDeleteMutation.mutate(categorySelected)}>XÓA HOÀN TOÀN</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

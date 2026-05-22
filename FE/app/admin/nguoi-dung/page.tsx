"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  UserCog,
  Trash2,
  MapPin,
  RotateCcw,
  XCircle,
  MoreVertical,
  UserPlus,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/admin/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { userService, UserProfile } from "@/services/userService"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userActionId, setUserActionId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Dialog States
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false)
  const [isForceLogoutDialogOpen, setIsForceLogoutDialogOpen] = useState(false)

  // Selection States
  const [newRole, setNewRole] = useState<string>("")
  const [newStatus, setNewStatus] = useState<string>("")

  // Filter States
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const resetFilters = () => {
    setSearchQuery("")
    setRoleFilter("ALL")
    setStatusFilter("ALL")
    setCurrentPage(1)
  }

  const isFiltered = searchQuery !== "" || roleFilter !== "ALL" || statusFilter !== "ALL"

  const { data: users = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["admin_users"],
    queryFn: () => userService.getAllUsers()
  })

  const { data: trashedUsers = [], isLoading: isLoadingTrash } = useQuery({
    queryKey: ["admin_trashed_users"],
    queryFn: () => userService.getTrashedUsers(),
    enabled: activeTab === "trash"
  })

  // Mutations
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number, role: string }) => userService.updateRole(id, role),
    onSuccess: () => {
      toast.success("Đã cập nhật vai trò người dùng")
      queryClient.invalidateQueries({ queryKey: ["admin_users"] })
      setIsRoleDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi cập nhật vai trò")
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => userService.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái tài khoản")
      queryClient.invalidateQueries({ queryKey: ["admin_users"] })
      setIsStatusDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi cập nhật trạng thái")
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      toast.success("Tài khoản đã được đưa vào thùng rác")
      queryClient.invalidateQueries({ queryKey: ["admin_users"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_users"] })
      setIsDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa người dùng")
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => userService.restoreUser(id),
    onSuccess: () => {
      toast.success("Đã khôi phục tài khoản người dùng")
      queryClient.invalidateQueries({ queryKey: ["admin_users"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_users"] })
      setIsRestoreDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi khôi phục")
  })

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => userService.hardDeleteUser(id),
    onSuccess: () => {
      toast.success("Đã xóa vĩnh viễn tài khoản")
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_users"] })
      setIsHardDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa vĩnh viễn")
  })

  const forceLogoutMutation = useMutation({
    mutationFn: (id: number) => userService.forceLogout(id),
    onSuccess: () => {
      toast.success("Đã cưỡng chế đăng xuất người dùng thành công")
    },
    onError: () => toast.error("Lỗi khi thực hiện đăng xuất")
  })

  const columns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: "userId",
      header: "Người dùng",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black shadow-sm ring-4 ring-blue-50">
            {row.original.fullName?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-800 text-[14px] line-clamp-1">{row.original.fullName || "Chưa cập nhật"}</span>
              {row.original.username && <Badge variant="secondary" className="text-[9px] font-black h-4 px-1 bg-slate-100 text-slate-500 rounded">{row.original.username}</Badge>}
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "phone",
      header: "Số điện thoại",
      cell: ({ row }) => (
        <span className="font-bold text-slate-600 text-sm">{row.original.phone || "N/A"}</span>
      )
    },
    {
      accessorKey: "role",
      header: "Vai trò",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <Badge variant="outline" className={cn(
            "font-black px-3 py-1 rounded-lg border-none",
            role === "ADMIN" ? "bg-rose-50 text-rose-600" :
              role === "PHARMACIST" ? "bg-amber-50 text-amber-600" :
                "bg-blue-50 text-blue-600"
          )}>
            {role === "ADMIN" ? "Quản trị viên" : role === "PHARMACIST" ? "Dược sĩ" : "Thành viên"}
          </Badge>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full",
              status === "ACTIVE" ? "bg-emerald-500 animate-pulse" :
                status === "PENDING" ? "bg-amber-500" :
                  status === "BANNED" ? "bg-rose-500" : "bg-slate-400"
            )} />
            <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">
              {status === "ACTIVE" ? "Hoạt động" : status === "PENDING" ? "Chờ xác thực" : status === "BANNED" ? "Bị khóa" : "Ngoại tuyến"}
            </span>
          </div>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-blue-50 text-blue-600 rounded-lg"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedUser(row.original)
              setIsDetailsOpen(true)
            }}
          >
            <UserCog className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="rounded-lg text-slate-400">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl border-none" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase p-2 tracking-widest">Tác vụ ADMIN</DropdownMenuLabel>
              {activeTab === "all" ? (
                <>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setNewStatus(row.original.status || "ACTIVE")
                    setUserActionId(row.original.userId)
                    setIsStatusDialogOpen(true)
                  }} className="rounded-xl font-bold cursor-pointer">
                    Trạng thái tài khoản
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setNewRole(row.original.role || "USER")
                    setUserActionId(row.original.userId)
                    setIsRoleDialogOpen(true)
                  }} className="rounded-xl font-bold cursor-pointer">
                    Thay đổi vai trò
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setUserActionId(row.original.userId)
                    setIsForceLogoutDialogOpen(true)
                  }} className="text-amber-600 font-bold rounded-xl cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" /> Đăng xuất tài khoản này
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={() => {
                    setUserActionId(row.original.userId)
                    setIsDeleteDialogOpen(true)
                  }} className="text-rose-600 font-bold focus:bg-rose-50 rounded-xl cursor-pointer">
                    <Trash2 className="w-4 h-4 mr-2" /> Bỏ vào thùng rác
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => {
                    setUserActionId(row.original.userId)
                    setIsRestoreDialogOpen(true)
                  }} className="text-emerald-600 font-bold rounded-xl cursor-pointer">
                    <RotateCcw className="w-4 h-4 mr-2" /> Khôi phục tài khoản
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={() => {
                    setUserActionId(row.original.userId)
                    setIsHardDeleteDialogOpen(true)
                  }} className="text-rose-600 font-black focus:bg-rose-50 rounded-xl cursor-pointer">
                    <XCircle className="w-4 h-4 mr-2" /> XÓA VĨNH VIỄN
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ]

  const filteredUsers = (activeTab === "trash" ? trashedUsers : users).filter(u => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = (
      u.fullName?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.phone?.includes(query)
    )
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedRows = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (!isMounted) return null

  return (
    <div className="p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="w-[300px]">
            <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
              <TabsTrigger value="all" className="rounded-xl font-bold px-6 data-[state=active]:bg-white">Người dùng</TabsTrigger>
              <TabsTrigger value="trash" className="rounded-xl font-bold px-6 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600">Lưu trữ</TabsTrigger>
            </TabsList>
          </Tabs>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              {activeTab === "all" ? "Quản lý Người dùng" : "Danh sách Đã xóa"}
              {activeTab === "trash" && <Trash2 className="w-8 h-8 text-rose-400" />}
            </h1>
            <p className="text-slate-500 font-medium mt-1">Quản lý và kiểm tra hồ sơ khách hàng, phân quyền hệ thống.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-40 h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-600">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="Vai trò" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="ALL" className="font-bold rounded-xl">Tất cả vai trò</SelectItem>
              <SelectItem value="ADMIN" className="font-bold rounded-xl text-rose-600">Quản trị viên</SelectItem>
              <SelectItem value="PHARMACIST" className="font-bold rounded-xl text-amber-600">Dược sĩ</SelectItem>
              <SelectItem value="USER" className="font-bold rounded-xl text-blue-600">Người dùng</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-44 h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="ALL" className="font-bold rounded-xl">Mọi trạng thái</SelectItem>
              <SelectItem value="ACTIVE" className="font-bold rounded-xl">Đang hoạt động</SelectItem>
              <SelectItem value="PENDING" className="font-bold rounded-xl text-amber-500">Chờ xác thực</SelectItem>
              <SelectItem value="BANNED" className="font-bold rounded-xl text-rose-500">Bị khóa</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-80 ml-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Tìm email, tên, SĐT..."
              className="pl-12 h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-blue-100 font-bold"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-14 px-6 rounded-2xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center gap-2 shrink-0 border-none"
            >
              <X className="h-4 w-4" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {activeTab === "all" && (
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: "Tổng người dùng", value: (users?.length || 0).toString(), icon: Users, color: "blue" },
            { label: "Đang hoạt động", value: users?.filter(u => u.status === 'ACTIVE').length.toString(), icon: ShieldCheck, color: "emerald" },
            { label: "Chờ xác thực", value: users?.filter(u => u.status === 'PENDING').length.toString(), icon: Clock, color: "amber" },
            { label: "Quản trị viên", value: users?.filter(u => u.role === 'ADMIN').length.toString(), icon: ShieldCheck, color: "rose" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
              </div>
              <div className={cn("p-4 rounded-2xl",
                stat.color === "blue" ? "bg-blue-50 text-blue-500" :
                  stat.color === "emerald" ? "bg-emerald-50 text-emerald-500" :
                    stat.color === "amber" ? "bg-amber-50 text-amber-500" :
                      "bg-rose-50 text-rose-500"
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        <DataTable
          columns={columns}
          data={paginatedRows}
          hidePagination={true}
          loading={isLoadingAll || isLoadingTrash}
          onRowClick={(user) => {
            setSelectedUser(user)
            setIsDetailsOpen(true)
          }}
        />

        <div className="flex items-center justify-between px-8 py-6 bg-white border-t">
          <div className="text-sm font-bold text-slate-400">
            Hiển thị <span className="text-slate-800">{paginatedRows.length}</span> / {filteredUsers.length} người dùng
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-10 font-bold border-slate-200"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Trước
            </Button>

            <div className="flex items-center gap-1">
              {(() => {
                const total = totalPages;
                const current = currentPage;
                const renderBtn = (p: number) => (
                  <Button
                    key={p}
                    variant={p === current ? "default" : "outline"}
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      "w-10 h-10 p-0 rounded-full font-bold transition-all shadow-none border-none",
                      p === current
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                        : "bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    )}
                  >
                    {p}
                  </Button>
                );

                const pages = [];
                if (total <= 7) {
                  for (let i = 1; i <= total; i++) pages.push(renderBtn(i));
                } else {
                  pages.push(renderBtn(1));
                  if (current > 4) pages.push(<span key="ell1" className="px-1 text-slate-300">...</span>);
                  const start = Math.max(2, current - 2);
                  const end = Math.min(total - 1, current + 2);
                  for (let i = start; i <= end; i++) pages.push(renderBtn(i));
                  if (current < total - 3) pages.push(<span key="ell2" className="px-1 text-slate-300">...</span>);
                  pages.push(renderBtn(total));
                }
                return pages;
              })()}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-10 font-bold border-slate-200"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Tiếp <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Phân quyền người dùng</DialogTitle>
            <DialogDescription>Chọn vai trò mới cho tài khoản này.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            {[
              { val: "USER", label: "Hội viên (User)", desc: "Quyền hạn cơ bản cho khách hàng." },
              { val: "PHARMACIST", label: "Dược sĩ (Staff)", desc: "Quản lý kho và đánh giá sản phẩm." },
              { val: "ADMIN", label: "Quản trị (Admin)", desc: "Toàn quyền truy cập hệ thống." }
            ].map(r => (
              <div key={r.val}
                onClick={() => setNewRole(r.val)}
                className={cn(
                  "p-4 rounded-2xl border-2 cursor-pointer transition-all",
                  newRole === r.val ? "border-blue-600 bg-blue-50/50" : "border-slate-50 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800">{r.label}</span>
                  {newRole === r.val ? <div className="h-3 w-3 rounded-full bg-blue-600" /> : null}
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{r.desc}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => userActionId && roleMutation.mutate({ id: userActionId, role: newRole })}
              disabled={roleMutation.isPending}
              className="w-full h-14 rounded-2xl bg-blue-600 font-black text-white hover:bg-blue-700"
            >
              {roleMutation.isPending ? "Đang xử lý..." : "XÁC NHẬN THAY ĐỔI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Trạng thái tài khoản</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
            {[
              { val: "ACTIVE", label: "Kích hoạt", color: "emerald" },
              { val: "PENDING", label: "Chờ xác thực", color: "amber" },
              { val: "BANNED", label: "Khóa tài khoản", color: "rose" }
            ].map(s => (
              <div key={s.val}
                onClick={() => setNewStatus(s.val)}
                className={cn(
                  "p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between",
                  newStatus === s.val ? `border-${s.color}-600 bg-${s.color}-50/50` : "border-slate-50"
                )}
              >
                <span className="font-black text-slate-800">{s.label}</span>
                <div className={cn("h-4 w-4 rounded-full border-2", newStatus === s.val ? `bg-${s.color}-600 border-transparent` : "border-slate-200")} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => userActionId && statusMutation.mutate({ id: userActionId, status: newStatus })}
              disabled={statusMutation.isPending}
              className="w-full h-14 rounded-2xl bg-slate-900 font-black text-white"
            >
              CẬP NHẬT TRẠNG THÁI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogTitle className="sr-only">Hồ sơ người dùng</DialogTitle>
          {selectedUser && (
            <>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-12 pt-20 relative">
                <div className="absolute top-8 left-10 flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">
                  <ShieldCheck className="w-4 h-4" /> SECURE PROFILE
                </div>
                <div className="flex items-center gap-8">
                  <div className="h-28 w-28 rounded-[2rem] bg-white flex items-center justify-center text-slate-900 font-black text-4xl shadow-2xl relative border-4 border-slate-700/50">
                    {selectedUser.fullName?.charAt(0) || "U"}
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-emerald-500 rounded-full border-4 border-slate-800 shadow-lg" />
                  </div>
                  <div className="text-white space-y-1">
                    <h2 className="text-3xl font-black tracking-tight">{selectedUser.fullName || "N/A"}</h2>
                    <div className="flex items-center gap-2 opacity-60 font-bold text-sm">
                      <Mail className="w-3 h-3" /> {selectedUser.email}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="mt-2 bg-blue-600 text-[10px] font-black px-4 py-1 rounded-full">{selectedUser.role}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-12 space-y-10 bg-white">
                <div className="grid grid-cols-2 gap-x-10 gap-y-8">
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Số điện thoại
                    </label>
                    <p className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{selectedUser.phone || "---"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Ngày sinh
                    </label>
                    <p className="font-black text-slate-800 text-lg">{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString("vi-VN") : "---"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Ngày tham gia
                    </label>
                    <p className="font-black text-slate-800 text-lg">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("vi-VN") : "N/A"}</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Địa chỉ chính
                    </label>
                    <p className="font-bold text-slate-500 text-sm leading-relaxed italic">Sổ địa chỉ người dùng được quản lý trong tab Đơn hàng.</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[140px] rounded-[1.5rem] h-14 font-black text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-100"
                    onClick={() => {
                      setNewStatus(selectedUser.status || "ACTIVE")
                      setUserActionId(selectedUser.userId)
                      setIsStatusDialogOpen(true)
                    }}
                  >
                    TRẠNG THÁI
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[140px] rounded-[1.5rem] h-14 font-black text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100"
                    onClick={() => {
                      setNewRole(selectedUser.role || "USER")
                      setUserActionId(selectedUser.userId)
                      setIsRoleDialogOpen(true)
                    }}
                  >
                    VAI TRÒ
                  </Button>
                  <Button className="flex-1 min-w-[140px] rounded-[1.5rem] h-14 font-black bg-slate-900 text-white shadow-2xl shadow-slate-200 gap-2">
                    <UserPlus className="w-4 h-4" /> LIÊN HỆ
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialogs */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl p-8 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-800">Khóa & Lưu trữ tài khoản?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-slate-500">
              Người dùng này sẽ bị chặn truy cập hệ thống và chuyển vào mục Lưu trữ. <br />Bạn có thực sự muốn tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-8">
            <AlertDialogCancel className="rounded-2xl font-bold h-12">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction className="rounded-2xl bg-slate-900 font-black h-12 px-8" onClick={() => userActionId && deleteMutation.mutate(userActionId)}>XÁC NHẬN KHÓA</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent className="rounded-3xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-emerald-600">Khôi phục quyền truy cập?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-slate-500">Người dùng sẽ có thể đăng nhập và sử dụng dịch vụ trở lại bình thường.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-2xl font-bold h-12">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-2xl bg-emerald-600 font-black h-12 px-8" onClick={() => userActionId && restoreMutation.mutate(userActionId)}>KHÔI PHỤC NGAY</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isHardDeleteDialogOpen} onOpenChange={setIsHardDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[3rem] p-12 border-4 border-rose-50 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-black text-rose-600 uppercase tracking-tighter">XÓA VĨNH VIỄN TÀI KHOẢN?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-bold text-slate-600 italic py-4 leading-relaxed">
              CẢNH BÁO NGUY HIỂM: Mọi dữ liệu liên quan đến người dùng này sẽ bị XÓA SẠCH hoàn toàn. Thao tác này KHÔNG THỂ đảo ngược!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-8">
            <AlertDialogCancel className="rounded-[1.5rem] border-none font-bold text-slate-400">TÔI CẦN SUY NGHĨ LẠI</AlertDialogCancel>
            <AlertDialogAction className="rounded-[1.5rem] bg-rose-600 font-black h-14 px-12 shadow-2xl shadow-rose-200" onClick={() => userActionId && hardDeleteMutation.mutate(userActionId)}>XÁC NHẬN XÓA BỎ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isForceLogoutDialogOpen} onOpenChange={setIsForceLogoutDialogOpen}>
        <AlertDialogContent className="rounded-3xl p-8 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-800">Cưỡng chế đăng xuất?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-slate-500">
              Bạn có chắc muốn đăng xuất tài khoản này ngay lập tức trên tất cả thiết bị?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-8">
            <AlertDialogCancel className="rounded-2xl font-bold h-12">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction className="rounded-2xl bg-amber-600 hover:bg-amber-700 font-black h-12 px-8" onClick={() => { userActionId && forceLogoutMutation.mutate(userActionId); setIsForceLogoutDialogOpen(false); }}>XÁC NHẬN ĐĂNG XUẤT</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

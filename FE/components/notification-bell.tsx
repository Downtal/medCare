"use client"

import { Bell, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationStore, Notification } from "@/lib/store/useNotificationStore";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function NotificationBell() {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (status: string) => {
    switch (status) {
      case "APPROVED": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "REJECTED": return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <Popover onOpenChange={(open) => open && markAllAsRead()}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-2xl h-12 w-12 flex items-center justify-center hover:bg-primary/5 transition-all group"
        >
          <Bell className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <Badge className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full p-0 text-[10px] bg-rose-500 text-white border-2 border-background flex items-center justify-center shadow-md animate-in zoom-in duration-300">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white" align="end">
        <div className="bg-primary p-6 text-white">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-black uppercase tracking-tight">Thông báo</h3>
            <div className="flex items-center gap-2">
               {notifications.length > 0 && (
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
                   onClick={(e) => { e.stopPropagation(); clearNotifications(); }}
                 >
                   <Trash2 className="w-4 h-4" />
                 </Button>
               )}
            </div>
          </div>
          <p className="text-white/70 text-xs font-medium">Bạn có {unreadCount} thông báo mới chưa đọc</p>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar-slim bg-white">
          {notifications.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                <Bell className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400 italic">Hệ thống chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-5 transition-colors hover:bg-slate-50 cursor-pointer flex gap-4",
                    !n.isRead && "bg-blue-50/30"
                  )}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl shrink-0 flex items-center justify-center",
                    n.status === 'APPROVED' ? "bg-emerald-100" : "bg-rose-100"
                  )}>
                    {getIcon(n.status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-sm leading-tight", n.isRead ? "text-slate-600 font-medium" : "text-slate-900 font-black")}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-4 border-t border-slate-50 bg-slate-50/30 text-center">
             <Button variant="ghost" className="text-xs font-black text-primary hover:bg-transparent" onClick={markAllAsRead}>
                ĐÁNH DẤU TẤT CẢ LÀ ĐÃ ĐỌC
             </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

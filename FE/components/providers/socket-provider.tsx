"use client"

import { usePrescriptionSocket } from "@/hooks/use-prescription-socket";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  // Activate the socket hook
  usePrescriptionSocket();
  
  return <>{children}</>;
}

import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useNotificationStore } from "@/lib/store/useNotificationStore";

const SOCKET_URL = "http://localhost:8081/ws";

export const usePrescriptionSocket = () => {
  const { data: session } = useSession();
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    const socket = new SockJS(SOCKET_URL);
    stompClient.current = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.current.onConnect = (frame) => {
      // console.log("Connected to WebSocket: " + frame);
      
      // Subscribe to user-specific prescription updates
      stompClient.current?.subscribe(`/topic/prescriptions/${userId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          handleNotification(payload);
        } catch (e) {
          console.error("Error parsing socket message", e);
        }
      });
    };

    stompClient.current.onStompError = (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    };

    stompClient.current.activate();

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [session?.user?.id]);

  const handleNotification = (payload: any) => {
    const { status, message, userId, timestamp } = payload;
    
    // Save to store
    useNotificationStore.getState().addNotification({
      userId,
      status,
      message,
      timestamp: timestamp || new Date().toISOString()
    });

    if (status === "APPROVED") {
      toast.success(message, {
        description: "Bây giờ bạn có thể thêm các sản phẩm RX vào giỏ hàng.",
        duration: 10000,
      });
    } else if (status === "REJECTED") {
      toast.error("Đơn thuốc bị từ chối", {
        description: message,
        duration: 10000,
      });
    }
  };

  return stompClient.current;
};

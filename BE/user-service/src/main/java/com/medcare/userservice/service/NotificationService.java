package com.medcare.userservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendPrescriptionUpdate(Long userId, String status, String note) {
        String destination = "/topic/prescriptions/" + userId;
        Map<String, String> payload = Map.of(
            "userId", userId.toString(),
            "status", status,
            "message", getMessageByStatus(status, note),
            "timestamp", java.time.LocalDateTime.now().toString()
        );
        
        log.info("Sending prescription update to {}: {}", destination, status);
        messagingTemplate.convertAndSend(destination, payload);
    }

    private String getMessageByStatus(String status, String note) {
        return switch (status) {
            case "APPROVED" -> "Đơn thuốc của bạn đã được phê duyệt! Bạn có thể đặt hàng ngay.";
            case "REJECTED" -> "Đơn thuốc bị từ chối. Lý do: " + (note != null ? note : "Vui lòng kiểm tra lại ảnh.");
            default -> "Trạng thái đơn thuốc đã thay đổi.";
        };
    }
}

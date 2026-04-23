package com.medcare.reviewservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReplyRequest {
    // Set by controller from JWT token, not by client
    private Long staffId;
    private String staffName;
    private String staffRole; // "ADMIN" or "PHARMACIST"

    @NotBlank(message = "Nội dung trả lời không được để trống")
    @Size(max = 500, message = "Nội dung trả lời không quá 500 ký tự")
    private String content;
}

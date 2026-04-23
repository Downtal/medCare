package com.medcare.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChangePasswordRequest {

    @NotBlank(message = "Old password cannot be blank")
    private String oldPassword;

    @NotBlank(message = "New password cannot be blank")
    @jakarta.validation.constraints.Pattern(
        regexp = "^(?=.*[A-Z]).{8,}$", 
        message = "Mật khẩu mới phải có ít nhất 8 ký tự và chứa ít nhất một chữ cái viết hoa"
    )
    private String newPassword;
}

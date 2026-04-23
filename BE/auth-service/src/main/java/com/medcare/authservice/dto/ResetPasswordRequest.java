package com.medcare.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import jakarta.validation.constraints.Pattern;

@Data
public class ResetPasswordRequest {
    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Mã OTP không được để trống")
    private String otp;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Pattern(regexp = "^(?=.*[A-Z]).{8,}$", message = "Mật khẩu phải có ít nhất 8 ký tự và chứa ít nhất một chữ cái viết hoa")
    private String newPassword;
}

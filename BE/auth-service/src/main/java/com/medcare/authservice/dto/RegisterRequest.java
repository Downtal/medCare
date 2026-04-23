package com.medcare.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.Pattern;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 100, message = "Tên đăng nhập từ 3 đến 100 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(regexp = "^(?=.*[A-Z]).{8,}$", message = "Mật khẩu phải có ít nhất 8 ký tự và chứa ít nhất một chữ cái viết hoa")
    private String password;

    @Email(message = "Email không đúng định dạng")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @Pattern(regexp = "^(0|84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không đúng định dạng")
    private String phone;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

}

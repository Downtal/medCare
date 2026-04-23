package com.medcare.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateAddressRequest {

    @NotBlank(message = "Họ tên người nhận không được để trống")
    private String receiverName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không đúng định dạng")
    private String receiverPhone;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    private String fullAddress;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String city;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String ward;

    private Integer cityId;
    private Integer districtId;
    private String wardCode;

    private Boolean isDefault;
}

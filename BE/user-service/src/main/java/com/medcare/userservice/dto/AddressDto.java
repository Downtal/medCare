package com.medcare.userservice.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AddressDto {
    private Long id;
    private Long userId;
    private String receiverName;
    private String receiverPhone;
    private String fullAddress;
    private String city;
    private String district;
    private String ward;
    private Integer cityId;
    private Integer districtId;
    private String wardCode;
    private Boolean isDefault;
}

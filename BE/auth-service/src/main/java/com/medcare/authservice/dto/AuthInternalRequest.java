package com.medcare.authservice.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthInternalRequest {
    private String email;
    private String phone;
    private String role;
    private String status;
}

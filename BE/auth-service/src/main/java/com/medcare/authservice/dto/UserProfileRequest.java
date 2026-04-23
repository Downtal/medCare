package com.medcare.authservice.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserProfileRequest {
    private Long userId;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String dateOfBirth;
    private String role;
    private String status;
}

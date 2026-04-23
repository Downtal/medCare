package com.medcare.userservice.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserProfileDto {
    private Long userId;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String role;
    private String status;
    private LocalDate dateOfBirth;
    private LocalDateTime createdAt;
}

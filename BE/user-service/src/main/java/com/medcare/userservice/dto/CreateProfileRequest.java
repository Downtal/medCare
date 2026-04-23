package com.medcare.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

/**
 * Request DTO for creating a user profile.
 * Called internally by auth-service after successful registration.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateProfileRequest {

    /** The user_id from auth_users — this is the PK in user_profiles */
    private Long userId;

    @NotBlank(message = "Full name cannot be blank")
    private String fullName;

    private String username;

    @Email(message = "Email format is not valid")
    private String email;

    private String phone;
    private String role;
    private String status;
    private LocalDate dateOfBirth;
}

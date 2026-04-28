package com.medcare.userservice.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserHealthNoteDto {
    private Long userId;
    private String allergies;
    private String chronicConditions;
    private String specialStatus;
    private LocalDateTime updatedAt;
}

package com.medcare.userservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHealthNoteRequest {
    private String allergies;
    private String chronicConditions;
    private String specialStatus;
}

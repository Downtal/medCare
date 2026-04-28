package com.medcare.userservice.dto;
 
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHealthNoteRequest {
    @Size(max = 1000, message = "Thông tin dị ứng quá dài (tối đa 1000 ký tự)")
    private String allergies;

    @Size(max = 1000, message = "Thông tin bệnh lý quá dài (tối đa 1000 ký tự)")
    private String chronicConditions;

    @Size(max = 500, message = "Trạng thái đặc biệt quá dài")
    private String specialStatus;
}

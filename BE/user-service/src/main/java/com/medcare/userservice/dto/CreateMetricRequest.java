package com.medcare.userservice.dto;
 
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateMetricRequest {
    @NotBlank(message = "Loại chỉ số không được để trống")
    private String type;

    @NotNull(message = "Giá trị không được để trống")
    @Min(value = 1, message = "Giá trị phải lớn hơn 0")
    @Max(value = 600, message = "Giá trị không hợp lệ")
    private Double value;

    @NotBlank(message = "Đơn vị không được để trống")
    private String unit;
}

package com.medcare.productservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicineSymptomId implements Serializable {

    @Column(name = "medicine_id")
    private Long medicineId;

    @Column(name = "symptom_id")
    private Long symptomId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MedicineSymptomId that = (MedicineSymptomId) o;
        return Objects.equals(medicineId, that.medicineId) && Objects.equals(symptomId, that.symptomId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(medicineId, symptomId);
    }
}

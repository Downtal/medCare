package com.medcare.productservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medicine_symptoms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineSymptom {

    @EmbeddedId
    private MedicineSymptomId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("medicineId")
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("symptomId")
    @JoinColumn(name = "symptom_id")
    private Symptom symptom;

    @Column(name = "relevance_score")
    @Builder.Default
    private Float relevanceScore = 1.0f;
}

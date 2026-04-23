package com.medcare.productservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medicine_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineDetail {

    @Id
    @Column(name = "medicine_id")
    private Long medicineId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Column(length = 100)
    private String brand;

    @Column(length = 200)
    private String manufacturer;

    @Column(name = "country_of_origin", length = 100)
    private String countryOfOrigin;

    @Column(name = "dosage_form", length = 100)
    private String dosageForm;

    @Column(name = "expiry_date", length = 100)
    private String expiryDate;

    @Column(name = "active_ingredients", columnDefinition = "TEXT")
    private String activeIngredients;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String indications;

    @Column(name = "usage_instruction", columnDefinition = "TEXT")
    private String usageInstruction;

    @Column(columnDefinition = "TEXT")
    private String contraindications;

    @Column(name = "side_effects", columnDefinition = "TEXT")
    private String sideEffects;

    @Column(columnDefinition = "TEXT")
    private String precautions;

    @Column(name = "storage_conditions", columnDefinition = "TEXT")
    private String storageConditions;
}

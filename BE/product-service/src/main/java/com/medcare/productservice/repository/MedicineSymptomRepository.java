package com.medcare.productservice.repository;

import com.medcare.productservice.entity.MedicineSymptom;
import com.medcare.productservice.entity.MedicineSymptomId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineSymptomRepository extends JpaRepository<MedicineSymptom, MedicineSymptomId> {
    List<MedicineSymptom> findByMedicineId(Long medicineId);
    List<MedicineSymptom> findBySymptomId(Long symptomId);
}

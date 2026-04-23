package com.medcare.productservice.repository;

import com.medcare.productservice.entity.Symptom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SymptomRepository extends JpaRepository<Symptom, Long> {
    Optional<Symptom> findByName(String name);
}

package com.medcare.userservice.repository;

import com.medcare.userservice.entity.Prescription;
import com.medcare.userservice.entity.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Prescription> findByStatusOrderByCreatedAtAsc(PrescriptionStatus status);
}

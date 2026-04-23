package com.medcare.authservice.repository;

import com.medcare.authservice.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findByEmailAndOtpCodeAndType(String email, String otpCode, OtpVerification.OtpType type);
    Optional<OtpVerification> findByEmailAndType(String email, OtpVerification.OtpType type);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM OtpVerification o WHERE o.email = ?1 AND o.type = ?2")
    void deleteByEmailAndType(String email, OtpVerification.OtpType type);
}

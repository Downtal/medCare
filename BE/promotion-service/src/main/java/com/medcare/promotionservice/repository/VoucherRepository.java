package com.medcare.promotionservice.repository;

import com.medcare.promotionservice.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    java.util.List<Voucher> findByDeletedAtIsNull();
    java.util.List<Voucher> findByDeletedAtIsNotNull();
    Optional<Voucher> findByCodeAndIsActiveTrueAndDeletedAtIsNull(String code);
}

package com.medcare.promotionservice.repository;

import com.medcare.promotionservice.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {
    long countByVoucherIdAndUserId(Long voucherId, Long userId);
}

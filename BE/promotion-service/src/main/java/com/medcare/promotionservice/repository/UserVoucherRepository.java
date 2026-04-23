package com.medcare.promotionservice.repository;

import com.medcare.promotionservice.entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {

    boolean existsByUserIdAndVoucherId(Long userId, Long voucherId);

    @Query("SELECT uv FROM UserVoucher uv WHERE uv.userId = :userId AND uv.isUsed = false AND uv.voucher.isActive = true AND uv.voucher.deletedAt IS NULL AND (uv.voucher.endAt IS NULL OR uv.voucher.endAt > CURRENT_TIMESTAMP)")
    List<UserVoucher> findActiveAndUnusedByUserId(Long userId);

    Optional<UserVoucher> findByUserIdAndVoucherId(Long userId, Long voucherId);
}

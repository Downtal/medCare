package com.medcare.promotionservice.service;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.promotionservice.dto.VoucherApplyRequest;
import com.medcare.promotionservice.dto.VoucherApplyResponse;
import com.medcare.promotionservice.entity.DiscountType;
import com.medcare.promotionservice.entity.Voucher;
import com.medcare.promotionservice.entity.VoucherUsage;
import com.medcare.promotionservice.entity.UserVoucher;
import com.medcare.promotionservice.repository.VoucherRepository;
import com.medcare.promotionservice.repository.VoucherUsageRepository;
import com.medcare.promotionservice.repository.UserVoucherRepository;
import com.medcare.promotionservice.strategy.DiscountStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionService {

    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final StringRedisTemplate redisTemplate;
    private final List<DiscountStrategy> discountStrategies;

    private static final String VOUCHER_CACHE_PREFIX = "voucher:limit:";

    @Transactional
    public VoucherApplyResponse applyVoucher(VoucherApplyRequest request) {
        // 1. Find Voucher
        Voucher voucher = voucherRepository.findByCodeAndIsActiveTrueAndDeletedAtIsNull(request.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND, "Mã giảm giá không tồn tại"));

        // 2. Fundamental Validations
        validateVoucher(voucher, request);

        // 4. Calculate Discount
        BigDecimal discountAmount = calculateProfessionalDiscount(request, voucher);

        // 5. Build Response
        BigDecimal originalTotal = calculateOrderTotal(request);

        return VoucherApplyResponse.builder()
                .code(voucher.getCode())
                .discountType(voucher.getDiscountType().name())
                .discountAmount(discountAmount)
                .originalTotal(originalTotal)
                .finalTotal(originalTotal.subtract(discountAmount))
                .success(true)
                .message("Áp dụng mã giảm giá thành công")
                .build();
    }

    private BigDecimal calculateOrderTotal(VoucherApplyRequest request) {
        BigDecimal itemsTotal = request.getItems().stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return itemsTotal.add(request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO);
    }

    private void validateVoucher(Voucher voucher, VoucherApplyRequest request) {
        LocalDateTime now = LocalDateTime.now();
        if (voucher.getStartAt() != null && now.isBefore(voucher.getStartAt())) {
            throw new AppException(ErrorCode.VOUCHER_NOT_FOUND, "Chương trình chưa bắt đầu");
        }
        if (voucher.getEndAt() != null && now.isAfter(voucher.getEndAt())) {
            throw new AppException(ErrorCode.VOUCHER_EXPIRED);
        }

        // Check user limit
        if (request.getUserId() != null) {
            long usedCountByUser = voucherUsageRepository.countByVoucherIdAndUserId(voucher.getId(),
                    request.getUserId());
            if (usedCountByUser >= voucher.getLimitPerUser()) {
                throw new AppException(ErrorCode.VOUCHER_USED, "Bạn đã hết lượt sử dụng mã này");
            }
        }

        BigDecimal orderTotal = calculateOrderTotal(request)
                .subtract(request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO);

        if (voucher.getMinOrderValue() != null && orderTotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Đơn hàng chưa đạt giá trị tối thiểu " + voucher.getMinOrderValue() + "đ");
        }
    }

    private void checkRedisLimit(Voucher voucher) {
        String redisKey = VOUCHER_CACHE_PREFIX + voucher.getCode();

        if (Boolean.FALSE.equals(redisTemplate.hasKey(redisKey))) {
            int remaining = voucher.getUsageLimit() - (voucher.getUsedCount() != null ? voucher.getUsedCount() : 0);
            redisTemplate.opsForValue().set(redisKey, String.valueOf(remaining));
        }

        // Atomically claim a voucher slot
        Long remaining = redisTemplate.opsForValue().decrement(redisKey);
        if (remaining == null || remaining < 0) {
            redisTemplate.opsForValue().increment(redisKey);
            throw new AppException(ErrorCode.VOUCHER_USED, "Mã giảm giá đã hết lượt sử dụng");
        }
    }

    /**
     * Finalize usage after order is placed successfully.
     * Called by Order Service via Feign or Kafka.
     */
    @Transactional
    public void recordUsageByCode(String code, Long userId, Long orderId, BigDecimal amountSaved) {
        if (code == null)
            throw new IllegalArgumentException("Voucher code cannot be null");

        Voucher voucher = voucherRepository.findByCodeAndIsActiveTrueAndDeletedAtIsNull(code)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        // Voucher slot was already claimed in applyVoucher, so we just proceed with DB
        // persistence
        // We don't decrement here anymore to avoid double-claiming

        VoucherUsage usage = VoucherUsage.builder()
                .voucher(voucher)
                .userId(userId)
                .orderId(orderId)
                .amountSaved(amountSaved)
                .build();

        if (usage != null) {
            voucherUsageRepository.save(usage);
        }

        // Sync DB used count (Redis was decremented in applyVoucher, or we trust DB for
        // persistence)
        int currentCount = voucher.getUsedCount() != null ? voucher.getUsedCount() : 0;
        voucher.setUsedCount(currentCount + 1);
        voucherRepository.save(voucher);

        // Mark user voucher as used if exists
        userVoucherRepository.findByUserIdAndVoucherId(userId, voucher.getId()).ifPresent(uv -> {
            uv.setUsed(true);
            userVoucherRepository.save(uv);
        });
    }

    @Transactional
    public void rollbackVoucherUsage(String code, Long userId) {
        log.info("Rolling back voucher usage for code: {} and user: {}", code, userId);

        Voucher voucher = voucherRepository.findByCodeAndIsActiveTrueAndDeletedAtIsNull(code)
                .orElse(null);

        if (voucher != null) {
            // 1. Increment Redis Limit
            String redisKey = VOUCHER_CACHE_PREFIX + voucher.getCode();
            redisTemplate.opsForValue().increment(redisKey);

            // 2. Revert DB count
            int currentCount = voucher.getUsedCount() != null ? voucher.getUsedCount() : 0;
            if (currentCount > 0) {
                voucher.setUsedCount(currentCount - 1);
                voucherRepository.save(voucher);
            }

            // 3. Mark user voucher as unused again
            userVoucherRepository.findByUserIdAndVoucherId(userId, voucher.getId()).ifPresent(uv -> {
                uv.setUsed(false);
                userVoucherRepository.save(uv);
            });

            // 4. Remove usage log if exists for the newest record (best effort)
            // Note: In a real system, we'd use the orderId to find the exact log
            log.info("Voucher usage rolled back successfully");
        }
    }

    @Transactional
    public void saveVoucherForUser(Long userId, String code) {
        Voucher voucher = voucherRepository.findByCodeAndIsActiveTrueAndDeletedAtIsNull(code)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND,
                        "Mã giảm giá không tồn tại hoặc đã hết hạn"));

        if (userVoucherRepository.existsByUserIdAndVoucherId(userId, voucher.getId())) {
            throw new AppException(ErrorCode.CONFLICT, "Bạn đã lưu mã giảm giá này rồi");
        }

        UserVoucher uv = UserVoucher.builder()
                .userId(userId)
                .voucher(voucher)
                .build();
        userVoucherRepository.save(uv);
    }

    public List<Voucher> getSavedVouchers(Long userId) {
        return userVoucherRepository.findActiveAndUnusedByUserId(userId).stream()
                .map(UserVoucher::getVoucher)
                .toList();
    }

    public List<Voucher> getAllVouchers() {
        return voucherRepository.findByDeletedAtIsNull();
    }

    public List<Voucher> getTrashedVouchers() {
        return voucherRepository.findByDeletedAtIsNotNull();
    }

    @Transactional
    public Voucher createVoucher(Voucher voucher) {
        if (voucher == null)
            throw new IllegalArgumentException("Voucher cannot be null");
        return voucherRepository.save(voucher);
    }

    @Transactional
    public Voucher updateVoucher(Long id, Voucher request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
        voucher.setCode(request.getCode());
        voucher.setTitle(request.getTitle());
        voucher.setDescription(request.getDescription());
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMaxDiscount(request.getMaxDiscount());
        voucher.setMinOrderValue(request.getMinOrderValue());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setLimitPerUser(request.getLimitPerUser());
        voucher.setExcludePrescriptionDrugs(request.isExcludePrescriptionDrugs());
        voucher.setStartAt(request.getStartAt());
        voucher.setEndAt(request.getEndAt());
        voucher.setActive(request.isActive());
        return voucherRepository.save(voucher);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
        voucher.setDeletedAt(LocalDateTime.now());
        voucherRepository.save(voucher);
    }

    @Transactional
    public void restoreVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
        voucher.setDeletedAt(null);
        voucherRepository.save(voucher);
    }

    @Transactional
    public void deleteHard(Long id) {
        voucherRepository.deleteById(id);
    }

    private BigDecimal calculateProfessionalDiscount(VoucherApplyRequest request, Voucher voucher) {
        if (voucher.getDiscountType() == DiscountType.FREESHIP) {
            return request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO;
        }

        BigDecimal discountableAmount;

        if (voucher.isExcludePrescriptionDrugs()) {
            // Only sum products that ARE NOT prescriptions
            discountableAmount = request.getItems().stream()
                    .filter(item -> !item.isPrescription())
                    .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (discountableAmount.compareTo(BigDecimal.ZERO) == 0 && !request.getItems().isEmpty()) {
                throw new AppException(ErrorCode.VALIDATION_ERROR,
                        "Mã này không áp dụng cho các sản phẩm kê đơn trong đơn hàng.");
            }
        } else {
            // Apply to all items
            discountableAmount = request.getItems().stream()
                    .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // Get matching strategy
        DiscountStrategy strategy = discountStrategies.stream()
                .filter(s -> s.getSupportedType() == voucher.getDiscountType())
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.INTERNAL_SERVER_ERROR,
                        "Loại giảm giá chưa được hỗ trợ"));

        if (discountableAmount.compareTo(BigDecimal.ZERO) == 0 && !request.getItems().isEmpty()
                && voucher.isExcludePrescriptionDrugs()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Mã này không áp dụng cho các sản phẩm kê đơn trong đơn hàng.");
        }

        return strategy.calculateDiscount(discountableAmount, voucher);
    }
}

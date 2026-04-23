package com.medcare.reviewservice.repository;

import com.medcare.reviewservice.dto.ProductReviewSummary;
import com.medcare.reviewservice.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByDeletedAtIsNullOrderByCreatedAtDesc();
    List<Review> findByDeletedAtIsNotNullOrderByCreatedAtDesc();

    List<Review> findByProductIdAndIsApprovedTrueAndDeletedAtIsNullOrderByCreatedAtDesc(Long productId);

    List<Review> findByProductIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long productId);

    List<Review> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    boolean existsByProductIdAndGuestNameAndCreatedAtAfterAndDeletedAtIsNull(Long productId, String guestName, LocalDateTime after);

    boolean existsByProductIdAndUserIdAndCreatedAtAfterAndDeletedAtIsNull(Long productId, Long userId, LocalDateTime after);

    @Query(value = "SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE deleted_at IS NULL AND product_id = :productId", nativeQuery = true)
    Double getAverageRatingByProductId(@Param("productId") Long productId);

    @Query(value = "SELECT COUNT(*) FROM reviews WHERE deleted_at IS NULL AND product_id = :productId", nativeQuery = true)
    long countByProductId(@Param("productId") Long productId);

    // Sync guest reviews by phone or email when user registers/logs in
    List<Review> findByPhoneNumberAndUserIdIsNullAndDeletedAtIsNull(String phoneNumber);
    List<Review> findByEmailAndUserIdIsNullAndDeletedAtIsNull(String email);
    // Summarize reviews by product for admin management
    @Query("SELECT new com.medcare.reviewservice.dto.ProductReviewSummary(" +
           "r.productId, r.productName, r.productSlug, r.productImage, " +
           "r.brand, r.registrationNumber, r.countryOfOrigin, " +
           "COUNT(r), AVG(CAST(r.rating AS double)), " +
           "SUM(CASE WHEN r.replies IS EMPTY THEN 1 ELSE 0 END)) " +
           "FROM Review r " +
           "WHERE r.deletedAt IS NULL " +
           "GROUP BY r.productId, r.productName, r.productSlug, r.productImage, r.brand, r.registrationNumber, r.countryOfOrigin " +
           "ORDER BY COUNT(r) DESC")
    List<ProductReviewSummary> findProductReviewSummaries();

    List<Review> findByDeletedAtIsNullAndRepliesIsEmptyOrderByCreatedAtDesc();
}

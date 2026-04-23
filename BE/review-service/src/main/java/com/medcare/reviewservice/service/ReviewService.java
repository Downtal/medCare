package com.medcare.reviewservice.service;

import com.medcare.reviewservice.dto.*;
import com.medcare.reviewservice.entity.Review;
import com.medcare.reviewservice.entity.ReviewReply;
import com.medcare.reviewservice.repository.ReviewReplyRepository;
import com.medcare.reviewservice.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ReviewReplyRepository reviewReplyRepository;
    private static final int GUEST_COOLDOWN_HOURS = 2;
    private static final int USER_COOLDOWN_MINUTES = 30;

    public List<ReviewResponse> getReviewsByProduct(Long productId) {
        if (productId == null) return List.of();
        return reviewRepository.findByProductIdAndIsApprovedTrueAndDeletedAtIsNullOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getReviewsByUser(Long userId) {
        if (userId == null) return List.of();
        return reviewRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProductRatingResponse getRatingByProduct(Long productId) {
        if (productId == null) {
            return ProductRatingResponse.builder().averageRating(0.0).totalReviews(0L).build();
        }
        Double average = reviewRepository.getAverageRatingByProductId(productId);
        long total = reviewRepository.countByProductId(productId);
        return ProductRatingResponse.builder()
                .averageRating(average != null ? average : 0.0)
                .totalReviews(total)
                .build();
    }

    public ReviewResponse createReview(ReviewRequest request) {
        if (request.getUserId() != null) {
            boolean exists = reviewRepository.existsByProductIdAndUserIdAndCreatedAtAfterAndDeletedAtIsNull(
                    request.getProductId(), request.getUserId(),
                    LocalDateTime.now().minusMinutes(USER_COOLDOWN_MINUTES));
            if (exists) {
                throw new RuntimeException("Bạn chỉ có thể đánh giá sản phẩm này 30 phút một lần");
            }
        } else if (request.getGuestName() != null) {
            boolean exists = reviewRepository.existsByProductIdAndGuestNameAndCreatedAtAfterAndDeletedAtIsNull(
                    request.getProductId(), request.getGuestName(),
                    LocalDateTime.now().minusHours(GUEST_COOLDOWN_HOURS));
            if (exists) {
                throw new RuntimeException("Bạn vui lòng đợi 2 tiếng trước khi đánh giá lại");
            }
        }

        Review review = Review.builder()
                .productId(request.getProductId())
                .productSlug(request.getProductSlug())
                .productName(request.getProductName())
                .productImage(request.getProductImage())
                .brand(request.getBrand())
                .registrationNumber(request.getRegistrationNumber())
                .countryOfOrigin(request.getCountryOfOrigin())
                .userId(request.getUserId())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .guestName(stripHtmlTags(request.getGuestName()))
                .rating(request.getRating())
                .comment(stripHtmlTags(request.getComment()))
                .editCount(0)
                .isApproved(true)
                .build();
        
        return mapToResponse(reviewRepository.save(review));
    }

    public ReviewResponse updateReview(Long reviewId, Long requestingUserId, UpdateReviewRequest request) {
        if (reviewId == null || requestingUserId == null) throw new RuntimeException("ID is required");
        
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (review.getUserId() == null || !review.getUserId().equals(requestingUserId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa đánh giá này");
        }

        if (review.getDeletedAt() != null) throw new RuntimeException("Đánh giá này đã bị xóa");

        if (review.getEditCount() != null && review.getEditCount() >= 1) {
            throw new RuntimeException("Bạn chỉ có thể chỉnh sửa đánh giá này tối đa 1 lần");
        }

        if (review.getCreatedAt() != null && review.getCreatedAt().isBefore(LocalDateTime.now().minusWeeks(1))) {
            throw new RuntimeException("Đã quá thời hạn 1 tuần để chỉnh sửa đánh giá này");
        }

        if (request.getRating() != null) review.setRating(request.getRating());
        if (request.getComment() != null) review.setComment(stripHtmlTags(request.getComment()));
        
        review.setEditCount((review.getEditCount() == null ? 0 : review.getEditCount()) + 1);
        
        return mapToResponse(reviewRepository.save(review));
    }

    public int syncGuestReviews(Long userId, String phone, String email) {
        if (userId == null) return 0;
        int count = 0;
        if (phone != null && !phone.isBlank()) {
            List<Review> phoneReviews = reviewRepository.findByPhoneNumberAndUserIdIsNullAndDeletedAtIsNull(phone);
            for (Review r : phoneReviews) {
                r.setUserId(userId);
                reviewRepository.save(r);
                count++;
            }
        }
        if (email != null && !email.isBlank()) {
            List<Review> emailReviews = reviewRepository.findByEmailAndUserIdIsNullAndDeletedAtIsNull(email);
            for (Review r : emailReviews) {
                if (r.getUserId() == null) {
                    r.setUserId(userId);
                    reviewRepository.save(r);
                    count++;
                }
            }
        }
        return count;
    }

    public ReviewResponse createReply(Long reviewId, ReplyRequest request) {
        if (reviewId == null) throw new RuntimeException("Review ID is required");
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        ReviewReply reply = ReviewReply.builder()
                .review(review)
                .staffId(request.getStaffId())
                .staffName(request.getStaffName() != null ? request.getStaffName() : "Dược sĩ MedCare")
                .staffRole(request.getStaffRole() != null ? request.getStaffRole() : "PHARMACIST")
                .content(request.getContent()) // Keep formatting if pharmacists use it
                .build();

        reviewReplyRepository.save(reply);
        
        Review updated = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        return mapToResponse(updated);
    }

    public ReviewResponse updateReply(Long replyId, String newContent, Long staffId) {
        ReviewReply reply = reviewReplyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));
        
        // Optional: Check if the staff member is the one who wrote it or an ADMIN
        // For simplicity in Admin Dashboard, we just update it
        reply.setContent(newContent);
        reviewReplyRepository.save(reply);
        
        return mapToResponse(reply.getReview());
    }

    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findByDeletedAtIsNullOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getTrashedReviews() {
        return reviewRepository.findByDeletedAtIsNotNullOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProductReviewSummary> getProductSummaries() {
        return reviewRepository.findProductReviewSummaries();
    }

    public List<ReviewResponse> getUnrepliedReviews() {
        return reviewRepository.findByDeletedAtIsNullAndRepliesIsEmptyOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setDeletedAt(LocalDateTime.now());
        reviewRepository.save(review);
    }

    public void restoreReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setDeletedAt(null);
        reviewRepository.save(review);
    }

    public void deleteHard(Long reviewId) {
        reviewRepository.deleteById(reviewId);
    }

    private String stripHtmlTags(String input) {
        if (input == null) return null;
        return input.replaceAll("<[^>]*>", "");
    }

    private ReviewResponse mapToResponse(Review review) {
        if (review == null) return null;
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProductId())
                .productSlug(review.getProductSlug())
                .productName(review.getProductName())
                .productImage(review.getProductImage())
                .brand(review.getBrand())
                .registrationNumber(review.getRegistrationNumber())
                .countryOfOrigin(review.getCountryOfOrigin())
                .editCount(review.getEditCount() != null ? review.getEditCount() : 0)
                .userId(review.getUserId())
                .guestName(review.getGuestName())
                .phoneNumber(review.getPhoneNumber())
                .email(review.getEmail())
                .rating(review.getRating())
                .comment(review.getComment())
                .isApproved(review.getIsApproved())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .deletedAt(review.getDeletedAt())
                .replies(review.getReplies() != null ? review.getReplies().stream()
                        .map(r -> ReviewResponse.ReplyResponse.builder()
                                .id(r.getId())
                                .staffId(r.getStaffId())
                                .staffName(r.getStaffName())
                                .staffRole(r.getStaffRole())
                                .content(r.getContent())
                                .createdAt(r.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()) : List.of())
                .build();
    }
}

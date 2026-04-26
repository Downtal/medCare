package com.medcare.reviewservice.controller;

import com.medcare.reviewservice.dto.*;
import com.medcare.reviewservice.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public List<ReviewResponse> getReviewsByProduct(@PathVariable Long productId) {
        return reviewService.getReviewsByProduct(productId);
    }

    @GetMapping("/product/{productId}/rating")
    public ProductRatingResponse getProductRating(@PathVariable Long productId) {
        return reviewService.getRatingByProduct(productId);
    }

    /** Get all reviews by the authenticated user */
    @GetMapping("/my-reviews")
    public List<ReviewResponse> getMyReviews(@AuthenticationPrincipal String userId) {
        if (userId == null)
            return List.of();
        return reviewService.getReviewsByUser(Long.valueOf(userId));
    }

    @PostMapping
    public ReviewResponse createReview(@Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId != null) {
            request.setUserId(Long.valueOf(userId));
        }
        return reviewService.createReview(request);
    }

    /** Edit own review - user must own the review */
    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(@PathVariable Long reviewId,
            @Valid @RequestBody UpdateReviewRequest request,
            @AuthenticationPrincipal String userId) {
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Bạn cần đăng nhập để chỉnh sửa đánh giá"));
        }
        return ResponseEntity.ok(reviewService.updateReview(reviewId, Long.valueOf(userId), request));
    }

    /**
     * Reply to a review - ONLY for ADMIN or PHARMACIST
     * Role is read from the JWT via X-User-Role header set by the gateway
     */
    @PostMapping("/{reviewId}/replies")
    public ResponseEntity<?> createReply(@PathVariable Long reviewId,
            @Valid @RequestBody ReplyRequest request,
            @AuthenticationPrincipal String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Name", required = false) String userName) {
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Bạn cần đăng nhập"));
        }
        if (!"ADMIN".equals(userRole) && !"PHARMACIST".equals(userRole)) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Chỉ quản trị viên hoặc dược sĩ mới có thể trả lời đánh giá"));
        }
        request.setStaffId(Long.valueOf(userId));
        request.setStaffName(
                userName != null ? userName : (userRole.equals("PHARMACIST") ? "Dược sĩ MedCare" : "Quản trị viên"));
        request.setStaffRole(userRole);
        return ResponseEntity.ok(reviewService.createReply(reviewId, request));
    }

    @PutMapping("/replies/{replyId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> updateReply(@PathVariable Long replyId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String userId) {
        if (userId == null)
            return ResponseEntity.status(401).build();
        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nội dung không được để trống"));
        }
        return ResponseEntity.ok(reviewService.updateReply(replyId, content, Long.valueOf(userId)));
    }

    /**
     * Sync guest reviews to a user account (called after login/register)
     */
    @PostMapping("/sync-guest")
    public ResponseEntity<?> syncGuestReviews(@AuthenticationPrincipal String userId,
            @RequestBody Map<String, String> body) {
        if (userId == null)
            return ResponseEntity.status(401).build();
        int count = reviewService.syncGuestReviews(Long.valueOf(userId), body.get("phone"), body.get("email"));
        return ResponseEntity.ok(Map.of("synced", count));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> getAllReviewsAdmin() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @DeleteMapping("/admin/{reviewId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> deleteReviewAdmin(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok(Map.of("message", "Review moved to trash"));
    }

    @GetMapping("/admin/trash")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> getTrashedReviewsAdmin() {
        return ResponseEntity.ok(reviewService.getTrashedReviews());
    }

    @PostMapping("/admin/{reviewId}/restore")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> restoreReviewAdmin(@PathVariable Long reviewId) {
        reviewService.restoreReview(reviewId);
        return ResponseEntity.ok(Map.of("message", "Review restored"));
    }

    @DeleteMapping("/admin/{reviewId}/hard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteHardAdmin(@PathVariable Long reviewId) {
        reviewService.deleteHard(reviewId);
        return ResponseEntity.ok(Map.of("message", "Review deleted permanently"));
    }

    @GetMapping("/admin/summaries")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> getProductSummaries() {
        return ResponseEntity.ok(reviewService.getProductSummaries());
    }

    @GetMapping("/admin/unreplied")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> getUnrepliedReviews() {
        return ResponseEntity.ok(reviewService.getUnrepliedReviews());
    }
}

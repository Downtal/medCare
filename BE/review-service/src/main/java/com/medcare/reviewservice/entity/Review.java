package com.medcare.reviewservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_slug")
    private String productSlug;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_image")
    private String productImage;

    @Column(name = "brand")
    private String brand;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "country_of_origin")
    private String countryOfOrigin;

    @Builder.Default
    @Column(name = "edit_count")
    private Integer editCount = 0;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "guest_phone")
    private String phoneNumber;

    @Column(name = "guest_email")
    private String email;

    @Column(name = "guest_name", length = 100)
    private String guestName;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "is_approved")
    private Boolean isApproved;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ReviewReply> replies;
}

package com.medcare.productservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, length = 120)
    private String slug;

    @Column(name = "parent_id")
    private Long parentId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(name = "status")
    private Boolean status = true;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    @PreUpdate
    public void generateSlug() {
        if (this.slug == null || this.slug.isEmpty()) {
            this.slug = name.toLowerCase()
                    .replaceAll("[^a-z0-9]", "-")
                    .replaceAll("-+", "-")
                    .replaceAll("^-|-$", "")
                    + "-" + System.currentTimeMillis();
        }
    }
}

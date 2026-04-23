package com.medcare.productservice.dto;

import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;
    private String name;
    private String slug;
    private Long parentId;
    private List<CategoryResponse> children;
    private List<ProductResponse> recentProducts;
    private LocalDateTime createdAt;
    private Boolean status;
    private LocalDateTime deletedAt;
}

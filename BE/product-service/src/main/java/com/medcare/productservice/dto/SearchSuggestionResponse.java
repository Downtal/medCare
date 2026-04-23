package com.medcare.productservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchSuggestionResponse {
    private List<ProductSuggestion> products;
    private List<CategorySuggestion> categories;
    private List<String> relatedKeywords;
    private List<String> trendingKeywords;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSuggestion {
        private Long id;
        private String name;
        private String slug;
        private String primaryImageUrl;
        private java.math.BigDecimal price;
        private String packingUnit;
        private boolean requiresPrescription;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySuggestion {
        private Long id;
        private String name;
        private String slug;
    }
}

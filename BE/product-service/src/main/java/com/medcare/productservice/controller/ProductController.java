package com.medcare.productservice.controller;

import com.medcare.common.dto.PageResponse;
import com.medcare.productservice.dto.ProductRequest;
import com.medcare.productservice.dto.ProductResponse;
import com.medcare.productservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/all")
    public ResponseEntity<List<ProductResponse>> getAllProductsSync() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductRequest request) {
        try {
            return ResponseEntity.ok(productService.createProduct(request));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String message = "Lá»—i trÃ¹ng láº·p dá»¯ liá»‡u: MÃ£ SKU hoáº·c Sá»‘ Ä‘Äƒng kÃ½ Ä‘Ã£ tá»“n táº¡i trong há»‡ thá»‘ng.";
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("message", message, "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "Lá»—i khi táº¡o sáº£n pháº©m: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        try {
            return ResponseEntity.ok(productService.updateProduct(id, request));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String message = "Lá»—i trÃ¹ng láº·p dá»¯ liá»‡u: MÃ£ SKU hoáº·c Sá»‘ Ä‘Äƒng kÃ½ Ä‘Ã£ tá»“n táº¡i trong há»‡ thá»‘ng.";
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("message", message, "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "Lá»—i khi cáº­p nháº­t sáº£n pháº©m: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/slug/{*slug}")
    public ResponseEntity<ProductResponse> getProductBySlug(@PathVariable String slug) {
        String cleanSlug = (slug != null && slug.startsWith("/")) ? slug.substring(1) : slug;
        return ResponseEntity.ok(productService.getProductBySlug(cleanSlug));
    }

    @GetMapping("/by-slug")
    public ResponseEntity<ProductResponse> getProductBySlugQuery(@RequestParam("slug") String slug) {
        return ResponseEntity.ok(productService.getProductBySlug(slug));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ProductResponse>> getAllProducts(
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "15", required = false) int size) {
        return ResponseEntity.ok(productService.getAllProductsPaginated(page, size));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<PageResponse<ProductResponse>> getProductsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "15", required = false) int size,
            @RequestParam(value = "includeChildren", defaultValue = "true", required = false) boolean includeChildren) {
        return ResponseEntity
                .ok(productService.getProductsByCategoryPaginated(categoryId, page, size, includeChildren));
    }

    @GetMapping("/category/slug/{*categorySlug}")
    public ResponseEntity<PageResponse<ProductResponse>> getProductsByCategorySlug(
            @PathVariable String categorySlug,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "15", required = false) int size,
            @RequestParam(value = "includeChildren", defaultValue = "true", required = false) boolean includeChildren) {
        try {
            String cleanSlug = (categorySlug != null && categorySlug.startsWith("/")) ? categorySlug.substring(1)
                    : categorySlug;
            return ResponseEntity
                    .ok(productService.getProductsByCategorySlugPaginated(cleanSlug, page, size, includeChildren));
        } catch (RuntimeException e) {
            // Return empty page instead of 500 when category slug not found
            PageResponse<ProductResponse> empty = PageResponse.<ProductResponse>builder()
                    .content(Collections.emptyList())
                    .pageNo(page).pageSize(size)
                    .totalElements(0).totalPages(0).last(true)
                    .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(empty);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<ProductResponse>> searchProducts(
            @RequestParam("q") String query,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "15", required = false) int size) {
        return ResponseEntity.ok(productService.searchProductsPaginated(query, page, size));
    }

    @GetMapping("/search-suggestions")
    public ResponseEntity<com.medcare.productservice.dto.SearchSuggestionResponse> getSearchSuggestions(
            @RequestParam("q") String query) {
        return ResponseEntity.ok(productService.getSearchSuggestions(query));
    }

    @GetMapping("/brands")
    public ResponseEntity<List<String>> getAllBrands() {
        return ResponseEntity.ok(productService.getAllBrands());
    }

    @GetMapping("/origins")
    public ResponseEntity<List<String>> getAllOrigins() {
        return ResponseEntity.ok(productService.getAllOrigins());
    }

    @GetMapping("/deleted")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<List<ProductResponse>> getDeletedProducts() {
        return ResponseEntity.ok(productService.getDeletedProducts());
    }

    @PostMapping("/restore/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PHARMACIST')")
    public ResponseEntity<Void> restoreProduct(@PathVariable Long id) {
        productService.restoreProduct(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/hard-delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> hardDeleteProduct(@PathVariable Long id) {
        productService.hardDeleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}

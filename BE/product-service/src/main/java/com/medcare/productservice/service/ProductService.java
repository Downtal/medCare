package com.medcare.productservice.service;

import com.medcare.common.dto.PageResponse;
import com.medcare.productservice.dto.ProductRequest;
import com.medcare.productservice.dto.ProductResponse;

import java.util.List;

public interface ProductService {
    ProductResponse createProduct(ProductRequest request);

    ProductResponse updateProduct(Long id, ProductRequest request);

    void deleteProduct(Long id);

    ProductResponse getProductById(Long id);

    ProductResponse getProductBySlug(String slug);

    List<ProductResponse> getAllProducts();

    PageResponse<ProductResponse> getAllProductsPaginated(int pageNo, int pageSize);

    List<ProductResponse> getProductsByCategory(Long categoryId);

    PageResponse<ProductResponse> getProductsByCategoryPaginated(Long categoryId, int pageNo, int pageSize,
            boolean includeChildren);

    PageResponse<ProductResponse> getProductsByCategorySlugPaginated(String categorySlug, int pageNo, int pageSize,
            boolean includeChildren);

    List<ProductResponse> searchProducts(String name);

    PageResponse<ProductResponse> searchProductsPaginated(String name, int pageNo, int pageSize);

    List<String> getAllBrands();

    List<String> getAllOrigins();

    com.medcare.productservice.dto.SearchSuggestionResponse getSearchSuggestions(String query);

    List<ProductResponse> getRecentProductsByCategory(Long categoryId);

    List<ProductResponse> getDeletedProducts();

    void restoreProduct(Long id);

    void hardDeleteProduct(Long id);
}


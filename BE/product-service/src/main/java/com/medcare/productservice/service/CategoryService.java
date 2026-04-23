package com.medcare.productservice.service;

import com.medcare.productservice.dto.CategoryRequest;
import com.medcare.productservice.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
    CategoryResponse getCategoryById(Long id);
    List<CategoryResponse> getAllCategories();
    List<CategoryResponse> getParentCategories();
    List<CategoryResponse> getSubCategories(Long parentId);
    List<CategoryResponse> getCategoryTree();
    
    // Trash / Soft Delete
    List<CategoryResponse> getTrashedCategories();
    void restoreCategory(Long id);
    void deleteHard(Long id);
}

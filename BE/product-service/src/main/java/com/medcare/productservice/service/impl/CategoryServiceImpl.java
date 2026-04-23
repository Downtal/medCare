package com.medcare.productservice.service.impl;

import com.medcare.productservice.dto.CategoryRequest;
import com.medcare.productservice.dto.CategoryResponse;
import com.medcare.productservice.entity.Category;
import com.medcare.productservice.dto.ProductResponse;
import com.medcare.productservice.entity.Medicine;
import com.medcare.productservice.entity.MedicineImage;
import com.medcare.productservice.repository.CategoryRepository;
import com.medcare.productservice.repository.MedicineRepository;
import com.medcare.productservice.client.InventoryClient;
import com.medcare.productservice.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryClient inventoryClient;

    @Override
    @CacheEvict(value = "categoryTreeV6", allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        Category category = Category.builder()
                .name(request.getName())
                .parentId(request.getParentId())
                .status(true)
                .build();
        Category saved = categoryRepository.save(category);
        return mapToResponse(saved);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "categoryTreeV6", allEntries = true),
            @CacheEvict(value = "categories", key = "#id")
    })
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục id: " + id));
        category.setName(request.getName());
        category.setParentId(request.getParentId());
        Category saved = categoryRepository.save(category);
        return mapToResponse(saved);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "categoryTreeV6", allEntries = true),
            @CacheEvict(value = "categories", key = "#id")
    })
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục id: " + id));
        category.setDeletedAt(LocalDateTime.now());
        categoryRepository.save(category);
    }

    @Override
    @Cacheable(value = "categories", key = "#id")
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục id: " + id));
        return mapToResponse(category);
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findByDeletedAtIsNull().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> getSubCategories(Long parentId) {
        return categoryRepository.findByParentIdAndDeletedAtIsNull(parentId).stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> getParentCategories() {
        return categoryRepository.findByParentIdIsNullAndDeletedAtIsNull().stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "categoryTreeV6")
    public List<CategoryResponse> getCategoryTree() {
        List<Category> allCategories = categoryRepository.findByDeletedAtIsNull();
        return allCategories.stream()
                .filter(c -> c.getParentId() == null)
                .map(parent -> {
                    CategoryResponse response = mapToResponseWithChildren(parent, allCategories);
                    List<Long> allRelatedIds = new java.util.ArrayList<>();
                    allRelatedIds.add(parent.getId());
                    if (response.getChildren() != null) {
                        response.getChildren().forEach(child -> allRelatedIds.add(child.getId()));
                    }
                    List<Medicine> randomMedicines = medicineRepository.findRandom4ByCategoryIdIn(allRelatedIds);
                    List<ProductResponse> productResponses = randomMedicines.stream()
                            .map(this::mapToProductResponse)
                            .collect(Collectors.toList());
                    
                    // Enrich with stock
                    enrichProductsWithStock(productResponses);
                    
                    response.setRecentProducts(productResponses);
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> getTrashedCategories() {
        return categoryRepository.findByDeletedAtIsNotNull().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "categoryTreeV6", allEntries = true)
    public void restoreCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục id: " + id));
        category.setDeletedAt(null);
        categoryRepository.save(category);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "categoryTreeV6", allEntries = true),
            @CacheEvict(value = "categories", key = "#id")
    })
    public void deleteHard(Long id) {
        categoryRepository.deleteById(id);
    }

    private ProductResponse mapToProductResponse(Medicine medicine) {
        return ProductResponse.builder()
                .id(medicine.getId())
                .name(medicine.getName())
                .slug(medicine.getSlug())
                .price(medicine.getPrices() != null && !medicine.getPrices().isEmpty() ? medicine.getPrices().get(0).getPrice() : java.math.BigDecimal.ZERO)
                .packingUnit(medicine.getPackingUnit())
                .requiresPrescription(medicine.getRequiresPrescription() != null ? medicine.getRequiresPrescription() : false)
                .primaryImageUrl(medicine.getImages() != null ? medicine.getImages().stream()
                        .filter(MedicineImage::getIsPrimary)
                        .findFirst()
                        .map(MedicineImage::getImageUrl)
                        .orElse(null) : null)
                .build();
    }

    private CategoryResponse mapToResponseWithChildren(Category category, List<Category> all) {
        CategoryResponse response = mapToResponse(category);
        List<CategoryResponse> children = all.stream()
                .filter(c -> category.getId().equals(c.getParentId()))
                .map(child -> mapToResponseWithChildren(child, all))
                .collect(Collectors.toList());
        response.setChildren(children);
        return response;
    }

    private void enrichProductsWithStock(List<ProductResponse> content) {
        if (content != null && !content.isEmpty()) {
            try {
                List<Long> ids = content.stream().map(ProductResponse::getId).collect(Collectors.toList());
                java.util.Map<?, ?> stocks = inventoryClient.getStocks(ids);
                if (stocks != null) {
                    content.forEach(resp -> {
                        Long id = resp.getId();
                        Object stockObj = stocks.get(id);

                        // Fallback for String keys
                        if (stockObj == null) {
                            stockObj = stocks.get(id.toString());
                        }

                        if (stockObj instanceof Number) {
                            resp.setStockQuantity(((Number) stockObj).intValue());
                        } else if (stockObj == null) {
                            resp.setStockQuantity(0);
                        }
                    });
                }
            } catch (Exception e) {
                // Ignore inventory fetch errors for display
            }
        }
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .parentId(category.getParentId())
                .createdAt(category.getCreatedAt())
                .status(category.getStatus())
                .deletedAt(category.getDeletedAt())
                .build();
    }
}

package com.medcare.productservice.service.impl;

import com.medcare.productservice.dto.PageResponse;
import com.medcare.productservice.dto.ProductRequest;
import com.medcare.productservice.dto.ProductResponse;
import com.medcare.productservice.entity.*;
import com.medcare.productservice.repository.CategoryRepository;
import com.medcare.productservice.repository.MedicineRepository;
import com.medcare.productservice.repository.MedicineSymptomRepository;
import com.medcare.productservice.repository.SymptomRepository;
import com.medcare.productservice.client.InventoryClient;
import com.medcare.productservice.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

        private final MedicineRepository medicineRepository;
        private final CategoryRepository categoryRepository;
        private final SymptomRepository symptomRepository;
        private final MedicineSymptomRepository medicineSymptomRepository;
        private final InventoryClient inventoryClient;
        private final CloudinaryService cloudinaryService;

        @Override
        @Transactional
        @Caching(evict = {
                        @CacheEvict(value = "categoryProductsV2", allEntries = true),
                        @CacheEvict(value = "categoryTreeV5", allEntries = true),
                        @CacheEvict(value = "productList", allEntries = true)
        })
        public ProductResponse createProduct(ProductRequest request) {
                // Convert empty strings to null for fields with UNIQUE constraints
                String sourceSku = safeTrim(request.getSourceSku(), 50);
                String registrationNumber = safeTrim(request.getRegistrationNumber(), 50);
                boolean requiresPrescription = request.getRequiresPrescription() != null
                                ? request.getRequiresPrescription()
                                : false;

                Medicine medicine = Medicine.builder()
                                .sourceSku(sourceSku)
                                .name(request.getName() != null ? request.getName().trim() : "")
                                .slug(generateSlug(request.getName()))
                                .categoryId(request.getCategoryId())
                                .registrationNumber(registrationNumber)
                                .requiresPrescription(requiresPrescription)
                                .packingUnit(safeTrim(request.getPackingUnit(), 100))
                                .status(true)
                                .build();

                // Details
                MedicineDetail detail = MedicineDetail.builder()
                                .medicine(medicine)
                                .brand(safeTrim(request.getBrand(), 100))
                                .manufacturer(safeTrim(request.getManufacturer(), 200))
                                .countryOfOrigin(safeTrim(request.getCountryOfOrigin(), 100))
                                .dosageForm(safeTrim(request.getDosageForm(), 100))
                                .expiryDate(safeTrim(request.getExpiryDate(), 100))
                                .activeIngredients(request.getActiveIngredients())
                                .description(request.getDescription())
                                .indications(request.getIndications())
                                .usageInstruction(request.getUsageInstruction())
                                .contraindications(request.getContraindications())
                                .sideEffects(request.getSideEffects())
                                .precautions(request.getPrecautions())
                                .storageConditions(request.getStorageConditions())
                                .build();
                medicine.setDetail(detail);

                // Price
                MedicinePrice price = MedicinePrice.builder()
                                .medicine(medicine)
                                .price(request.getPrice())
                                .originalPrice(request.getOriginalPrice())
                                .discountPercentage(request.getDiscountPercentage())
                                .isActive(true)
                                .build();
                medicine.setPrices(new java.util.ArrayList<>(java.util.Collections.singletonList(price)));

                // Multiple Images
                if (request.getImages() != null && !request.getImages().isEmpty()) {
                        List<MedicineImage> images = request.getImages().stream()
                                        .filter(img -> img.getImageUrl() != null && !img.getImageUrl().trim().isEmpty())
                                        .map(imgReq -> MedicineImage.builder()
                                                        .medicine(medicine)
                                                        .imageUrl(imgReq.getImageUrl().trim())
                                                        .isPrimary(imgReq.getIsPrimary() != null ? imgReq.getIsPrimary()
                                                                        : false)
                                                        .sortOrder(0)
                                                        .build())
                                        .collect(Collectors.toList());
                        medicine.setImages(images);
                } else if (request.getPrimaryImageUrl() != null && !request.getPrimaryImageUrl().trim().isEmpty()) {
                        MedicineImage image = MedicineImage.builder()
                                        .medicine(medicine)
                                        .imageUrl(request.getPrimaryImageUrl().trim())
                                        .isPrimary(true)
                                        .sortOrder(0)
                                        .build();
                        medicine.setImages(new java.util.ArrayList<>(java.util.Collections.singletonList(image)));
                } else {
                        medicine.setImages(new java.util.ArrayList<>());
                }

                Medicine saved = medicineRepository.save(medicine);

                // Process Symptoms Junction Table
                if (request.getSymptoms() != null && !request.getSymptoms().isEmpty()) {
                        for (String symptomName : request.getSymptoms()) {
                                if (symptomName == null || symptomName.trim().isEmpty())
                                        continue;

                                String finalName = symptomName.trim();
                                Symptom symptom = symptomRepository.findByName(finalName)
                                                .orElseGet(() -> symptomRepository
                                                                .save(Symptom.builder().name(finalName).build()));

                                medicineSymptomRepository.save(MedicineSymptom.builder()
                                                .id(new MedicineSymptomId(saved.getId(), symptom.getId()))
                                                .medicine(saved)
                                                .symptom(symptom)
                                                .relevanceScore(1.0f)
                                                .build());
                        }
                }

                // Notify Inventory Service about the new product and its initial stock
                try {
                        String batchNo = (request.getInitialBatchNumber() != null
                                        && !request.getInitialBatchNumber().isEmpty())
                                                        ? request.getInitialBatchNumber()
                                                        : "BATCH-" + java.time.format.DateTimeFormatter
                                                                        .ofPattern("ddMMyy-HHmm")
                                                                        .format(java.time.LocalDateTime.now());

                        String expiry = (request.getInitialExpiryDate() != null
                                        && !request.getInitialExpiryDate().isEmpty())
                                                        ? request.getInitialExpiryDate()
                                                        : java.time.LocalDate.now().plusYears(1).toString();

                        com.medcare.productservice.dto.ProductCreatedEvent event = com.medcare.productservice.dto.ProductCreatedEvent
                                        .builder()
                                        .medicineId(saved.getId())
                                        .name(saved.getName())
                                        .medicineSlug(saved.getSlug())
                                        .medicineImage(saved.getImages() != null && !saved.getImages().isEmpty()
                                                        ? saved.getImages().get(0).getImageUrl()
                                                        : null)
                                        .brand(request.getBrand())
                                        .registrationNumber(saved.getRegistrationNumber())
                                        .countryOfOrigin(request.getCountryOfOrigin())
                                        .initialQuantity(request.getInitialQuantity())
                                        .initialBatchNumber(batchNo)
                                        .initialExpiryDate(expiry)
                                        .build();
                        inventoryClient.onProductCreated(event);
                } catch (Exception e) {
                        // Log and continue, don't fail product creation if inventory init fails
                        System.err.println("Failed to initialize inventory for product: " + saved.getId() + ". Error: "
                                        + e.getMessage());
                }

                return mapToResponse(saved);
        }

        @Override
        @Transactional
        @Caching(evict = {
                        @CacheEvict(value = "categoryProductsV2", allEntries = true),
                        @CacheEvict(value = "categoryTreeV5", allEntries = true),
                        @CacheEvict(value = "productList", allEntries = true)
        })
        public ProductResponse updateProduct(Long id, ProductRequest request) {
                Medicine medicine = medicineRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm id: " + id));

                medicine.setSourceSku(safeTrim(request.getSourceSku(), 50));
                medicine.setName(request.getName() != null ? request.getName().trim() : "");
                medicine.setCategoryId(request.getCategoryId());
                medicine.setRegistrationNumber(safeTrim(request.getRegistrationNumber(), 50));
                medicine.setRequiresPrescription(
                                request.getRequiresPrescription() != null ? request.getRequiresPrescription() : false);
                medicine.setPackingUnit(safeTrim(request.getPackingUnit(), 100));

                MedicineDetail detail = medicine.getDetail();
                if (detail == null) {
                        detail = new MedicineDetail();
                        detail.setMedicine(medicine);
                        medicine.setDetail(detail);
                }
                detail.setBrand(safeTrim(request.getBrand(), 100));
                detail.setManufacturer(safeTrim(request.getManufacturer(), 200));
                detail.setCountryOfOrigin(safeTrim(request.getCountryOfOrigin(), 100));
                detail.setDosageForm(safeTrim(request.getDosageForm(), 100));
                detail.setExpiryDate(safeTrim(request.getExpiryDate(), 100));
                detail.setActiveIngredients(request.getActiveIngredients());
                detail.setDescription(request.getDescription());
                detail.setIndications(request.getIndications());
                detail.setUsageInstruction(request.getUsageInstruction());
                detail.setContraindications(request.getContraindications());
                detail.setSideEffects(request.getSideEffects());
                detail.setPrecautions(request.getPrecautions());
                detail.setStorageConditions(request.getStorageConditions());

                // Update Price
                if (medicine.getPrices() != null && !medicine.getPrices().isEmpty()) {
                        MedicinePrice currentPrice = medicine.getPrices().get(0);
                        currentPrice.setPrice(request.getPrice());
                        currentPrice.setOriginalPrice(request.getOriginalPrice());
                        currentPrice.setDiscountPercentage(request.getDiscountPercentage());
                } else {
                        MedicinePrice newPrice = MedicinePrice.builder()
                                        .medicine(medicine)
                                        .price(request.getPrice())
                                        .originalPrice(request.getOriginalPrice())
                                        .discountPercentage(request.getDiscountPercentage())
                                        .isActive(true)
                                        .build();
                        medicine.setPrices(new java.util.ArrayList<>(java.util.Collections.singletonList(newPrice)));
                }

                // Update Images
                if (request.getImages() != null && !request.getImages().isEmpty()) {
                        if (medicine.getImages() != null) {
                                medicine.getImages().clear();
                        } else {
                                medicine.setImages(new java.util.ArrayList<>());
                        }

                        List<MedicineImage> newImages = request.getImages().stream()
                                        .filter(img -> img.getImageUrl() != null && !img.getImageUrl().trim().isEmpty())
                                        .map(imgReq -> MedicineImage.builder()
                                                        .medicine(medicine)
                                                        .imageUrl(imgReq.getImageUrl().trim())
                                                        .isPrimary(imgReq.getIsPrimary() != null ? imgReq.getIsPrimary()
                                                                        : false)
                                                        .sortOrder(0)
                                                        .build())
                                        .collect(Collectors.toList());
                        medicine.getImages().addAll(newImages);
                } else if (request.getPrimaryImageUrl() != null && !request.getPrimaryImageUrl().trim().isEmpty()) {
                        if (medicine.getImages() != null && !medicine.getImages().isEmpty()) {
                                MedicineImage first = medicine.getImages().get(0);
                                first.setImageUrl(request.getPrimaryImageUrl().trim());
                                first.setIsPrimary(true);
                        } else {
                                MedicineImage image = MedicineImage.builder()
                                                .medicine(medicine)
                                                .imageUrl(request.getPrimaryImageUrl().trim())
                                                .isPrimary(true)
                                                .sortOrder(0)
                                                .build();
                                if (medicine.getImages() == null)
                                        medicine.setImages(new java.util.ArrayList<>());
                                medicine.getImages().add(image);
                        }
                }

                Medicine saved = medicineRepository.save(medicine);

                // Update Symptoms Junction Table
                if (request.getSymptoms() != null) {
                        // Clear old associations
                        List<MedicineSymptom> currentSymptoms = medicineSymptomRepository.findByMedicineId(id);
                        medicineSymptomRepository.deleteAll(currentSymptoms);

                        // Add new associations
                        for (String symptomName : request.getSymptoms()) {
                                if (symptomName == null || symptomName.trim().isEmpty())
                                        continue;

                                String finalName = symptomName.trim();
                                Symptom symptom = symptomRepository.findByName(finalName)
                                                .orElseGet(() -> symptomRepository
                                                                .save(Symptom.builder().name(finalName).build()));

                                medicineSymptomRepository.save(MedicineSymptom.builder()
                                                .id(new MedicineSymptomId(saved.getId(), symptom.getId()))
                                                .medicine(saved)
                                                .symptom(symptom)
                                                .relevanceScore(1.0f)
                                                .build());
                        }
                }

                // If update request includes new stock, import it
                if (request.getInitialQuantity() != null && request.getInitialQuantity() > 0) {
                        try {

                                String batchNo = (request.getInitialBatchNumber() != null
                                                && !request.getInitialBatchNumber().isEmpty())
                                                                ? request.getInitialBatchNumber()
                                                                : "BATCH-" + java.time.format.DateTimeFormatter
                                                                                .ofPattern("ddMMyy-HHmm")
                                                                                .format(java.time.LocalDateTime.now());

                                java.time.LocalDate expiry;
                                if (request.getInitialExpiryDate() != null
                                                && !request.getInitialExpiryDate().isEmpty()) {
                                        expiry = java.time.LocalDate.parse(request.getInitialExpiryDate());
                                } else {
                                        expiry = java.time.LocalDate.now().plusYears(1);
                                }

                                com.medcare.productservice.dto.InventoryImportRequest importRequest = com.medcare.productservice.dto.InventoryImportRequest
                                                .builder()
                                                .medicineId(saved.getId())
                                                .medicineName(saved.getName())
                                                .medicineSlug(saved.getSlug())
                                                .medicineImage(saved.getImages() != null && !saved.getImages().isEmpty()
                                                                ? saved.getImages().get(0).getImageUrl()
                                                                : null)
                                                .brand(request.getBrand())
                                                .registrationNumber(saved.getRegistrationNumber())
                                                .countryOfOrigin(request.getCountryOfOrigin())
                                                .warehouseId(1L) // Default warehouse
                                                .batchNumber(batchNo)
                                                .expiryDate(expiry)
                                                .quantity(request.getInitialQuantity())
                                                .notes("Updated stock via product edit")
                                                .build();
                                inventoryClient.importStock(importRequest);
                        } catch (Exception e) {
                                System.err.println("Failed to import stock during product update: " + saved.getId()
                                                + ". Error: " + e.getMessage());
                        }
                }

                return mapToResponse(saved);
        }

        @Override
        @Transactional
        @Caching(evict = {
                        @CacheEvict(value = "categoryProductsV2", allEntries = true),
                        @CacheEvict(value = "categoryTreeV5", allEntries = true),
                        @CacheEvict(value = "productList", allEntries = true)
        })
        public void deleteProduct(Long id) {
                Medicine medicine = medicineRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm id: " + id));
                medicine.setStatus(false);
                medicine.setDeletedAt(LocalDateTime.now());
                medicineRepository.save(medicine);
        }

        @Override
        public ProductResponse getProductById(Long id) {
                Medicine medicine = medicineRepository.findByIdAndStatusTrue(id)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm id: " + id));
                ProductResponse response = mapToResponse(medicine);
                try {
                        Integer freshStock = inventoryClient.getTotalStock(id);
                        if (freshStock != null) {
                                response.setStockQuantity(freshStock);
                        }
                } catch (Exception e) {
                        // Keep null if unreachable
                }
                return response;
        }

        @Override
        public ProductResponse getProductBySlug(String slug) {
                Medicine medicine = medicineRepository.findBySlugAndStatusTrue(slug)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm slug: " + slug));
                ProductResponse response = mapToResponse(medicine);
                try {
                        Integer freshStock = inventoryClient.getTotalStock(medicine.getId());
                        if (freshStock != null) {
                                response.setStockQuantity(freshStock);
                        }
                } catch (Exception e) {
                        // Keep null
                }
                return response;
        }

        @Override
        public List<ProductResponse> getAllProducts() {
                List<ProductResponse> responses = medicineRepository.findByStatusTrue().stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
                enrichWithFreshStock(responses);
                return responses;
        }

        @Override
        public PageResponse<ProductResponse> getAllProductsPaginated(int pageNo, int pageSize) {
                Pageable pageable = PageRequest.of(pageNo, pageSize);
                Page<Medicine> medicines = medicineRepository.findByStatusTrue(pageable);
                return mapToPageResponse(medicines);
        }

        @Override
        public List<ProductResponse> getProductsByCategory(Long categoryId) {
                List<ProductResponse> responses = medicineRepository.findByCategoryIdAndStatusTrue(categoryId).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
                enrichWithFreshStock(responses);
                return responses;
        }

        @Override
        public PageResponse<ProductResponse> getProductsByCategoryPaginated(Long categoryId, int pageNo, int pageSize,
                        boolean includeChildren) {
                Pageable pageable = PageRequest.of(pageNo, pageSize);
                Page<Medicine> medicines;

                if (includeChildren) {
                        // Collect this category + all direct child categories
                        List<Long> categoryIds = new java.util.ArrayList<>();
                        categoryIds.add(categoryId);
                        List<com.medcare.productservice.entity.Category> children = categoryRepository
                                        .findByParentIdAndDeletedAtIsNull(categoryId);
                        children.forEach(c -> categoryIds.add(c.getId()));
                        medicines = medicineRepository.findByCategoryIdInAndStatusTrue(categoryIds, pageable);
                } else {
                        medicines = medicineRepository.findByCategoryIdAndStatusTrue(categoryId, pageable);
                }

                return mapToPageResponse(medicines);
        }

        @Override
        public PageResponse<ProductResponse> getProductsByCategorySlugPaginated(String categorySlug, int pageNo,
                        int pageSize,
                        boolean includeChildren) {
                // Try full slug first
                com.medcare.productservice.entity.Category category = categoryRepository
                                .findBySlugAndDeletedAtIsNull(categorySlug).orElse(null);

                // Fallback: if not found and contains slash, try with the last part (leaf slug)
                if (category == null && categorySlug != null && categorySlug.contains("/")) {
                        String leafSlug = categorySlug.substring(categorySlug.lastIndexOf("/") + 1);
                        category = categoryRepository.findBySlugAndDeletedAtIsNull(leafSlug).orElse(null);
                }

                if (category == null) {
                        throw new RuntimeException("Không tìm thấy danh mục slug: " + categorySlug);
                }

                return getProductsByCategoryPaginated(category.getId(), pageNo, pageSize, includeChildren);
        }

        @Override
        public List<ProductResponse> searchProducts(String name) {
                List<ProductResponse> responses = medicineRepository.findByNameContainingIgnoreCaseAndStatusTrue(name)
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
                enrichWithFreshStock(responses);
                return responses;
        }

        @Override
        public PageResponse<ProductResponse> searchProductsPaginated(String name, int pageNo, int pageSize) {
                Pageable pageable = PageRequest.of(pageNo, pageSize);
                Page<Medicine> medicines = medicineRepository.findByNameContainingIgnoreCaseAndStatusTrue(name,
                                pageable);
                return mapToPageResponse(medicines);
        }

        @Override
        public List<String> getAllBrands() {
                return medicineRepository.findDistinctManufacturers();
        }

        @Override
        public List<String> getAllOrigins() {
                return medicineRepository.findDistinctCountriesOfOrigin();
        }

        @Override
        public com.medcare.productservice.dto.SearchSuggestionResponse getSearchSuggestions(String query) {
                if (query == null || query.trim().length() < 2) {
                        return com.medcare.productservice.dto.SearchSuggestionResponse.builder()
                                        .products(Collections.emptyList())
                                        .categories(Collections.emptyList())
                                        .trendingKeywords(List.of("Panadol", "Paracetamol", "Vitamin C", "Khẩu trang",
                                                        "Tiffy"))
                                        .build();
                }

                List<Medicine> medicineSuggestions = medicineRepository.findTopSearchSuggestions(query);
                List<Category> categorySuggestions = categoryRepository.findTopSuggestions(query);

                List<com.medcare.productservice.dto.SearchSuggestionResponse.ProductSuggestion> productDtos = medicineSuggestions
                                .stream()
                                .map(m -> com.medcare.productservice.dto.SearchSuggestionResponse.ProductSuggestion
                                                .builder()
                                                .id(m.getId())
                                                .name(m.getName())
                                                .slug(m.getSlug())
                                                .primaryImageUrl(m.getImages() != null ? m.getImages().stream()
                                                                .filter(MedicineImage::getIsPrimary)
                                                                .findFirst()
                                                                .map(MedicineImage::getImageUrl)
                                                                .orElse(null) : null)
                                                .price(m.getPrices() != null && !m.getPrices().isEmpty()
                                                                ? m.getPrices().get(0).getPrice()
                                                                : java.math.BigDecimal.ZERO)
                                                .packingUnit(m.getPackingUnit())
                                                .requiresPrescription(m.getRequiresPrescription())
                                                .build())
                                .collect(Collectors.toList());

                List<com.medcare.productservice.dto.SearchSuggestionResponse.CategorySuggestion> categoryDtos = categorySuggestions
                                .stream()
                                .map(c -> com.medcare.productservice.dto.SearchSuggestionResponse.CategorySuggestion
                                                .builder()
                                                .id(c.getId())
                                                .name(c.getName())
                                                .slug(c.getSlug())
                                                .build())
                                .collect(Collectors.toList());

                List<String> relatedKeywordsList = medicineSuggestions.stream()
                                .map(Medicine::getName)
                                .limit(5)
                                .collect(Collectors.toList());

                return com.medcare.productservice.dto.SearchSuggestionResponse.builder()
                                .products(productDtos.stream().limit(4).collect(Collectors.toList()))
                                .categories(categoryDtos)
                                .relatedKeywords(relatedKeywordsList)
                                .trendingKeywords(List.of("Khẩu trang", "Vitamin C", "Paracetamol", "Siro ho",
                                                "Nước rửa tay"))
                                .build();
        }

        @Override
        public List<ProductResponse> getRecentProductsByCategory(Long categoryId) {
                List<ProductResponse> responses = medicineRepository
                                .findTop4ByCategoryIdAndStatusTrueOrderByCreatedAtDesc(categoryId)
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
                enrichWithFreshStock(responses);
                return responses;
        }

        private <T> PageResponse<ProductResponse> mapToPageResponse(Page<Medicine> page) {
                List<ProductResponse> content = page.getContent().stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());

                enrichWithFreshStock(content);

                return PageResponse.<ProductResponse>builder()
                                .content(content)
                                .pageNo(page.getNumber())
                                .pageSize(page.getSize())
                                .totalElements(page.getTotalElements())
                                .totalPages(page.getTotalPages())
                                .last(page.isLast())
                                .build();
        }

        private void enrichWithFreshStock(List<ProductResponse> content) {
                if (content == null || content.isEmpty())
                        return;

                try {
                        List<Long> ids = content.stream().map(ProductResponse::getId).collect(Collectors.toList());
                        java.util.Map<?, ?> stocks = inventoryClient.getStocks(ids);

                        if (stocks != null) {
                                content.forEach(resp -> {
                                        Long id = resp.getId();
                                        Object stockObj = stocks.get(id);

                                        // Fallback for String keys (common in Jackson deserialization of Maps)
                                        if (stockObj == null) {
                                                stockObj = stocks.get(id.toString());
                                        }

                                        if (stockObj instanceof Number) {
                                                resp.setStockQuantity(((Number) stockObj).intValue());
                                        } else if (stockObj == null) {
                                                // If we successfully got the map but this ID is missing,
                                                // it likely means 0 stock in the inventory service
                                                resp.setStockQuantity(0);
                                        }
                                });
                        }
                } catch (Exception e) {
                        // If inventory service is down, we leave stockQuantity as null
                        // so the frontend doesn't show "Out of Stock" incorrectly.
                }
        }

        private ProductResponse mapToResponse(Medicine medicine) {
                Category category = categoryRepository.findById(medicine.getCategoryId()).orElse(null);
                String categoryName = (category != null) ? category.getName() : null;
                String categorySlug = (category != null) ? category.getSlug() : null;

                Long parentId = (category != null) ? category.getParentId() : null;
                String parentName = null;
                String parentSlug = null;
                if (parentId != null) {
                        Category parent = categoryRepository.findById(parentId).orElse(null);
                        if (parent != null) {
                                parentName = parent.getName();
                                parentSlug = parent.getSlug();
                        }
                }

                ProductResponse response = ProductResponse.builder()
                                .id(medicine.getId())
                                .name(medicine.getName())
                                .slug(medicine.getSlug())
                                .categoryId(medicine.getCategoryId())
                                .categoryName(categoryName)
                                .categorySlug(categorySlug)
                                .parentCategoryId(parentId)
                                .parentCategoryName(parentName)
                                .parentCategorySlug(parentSlug)
                                .registrationNumber(medicine.getRegistrationNumber())
                                .sourceSku(medicine.getSourceSku())
                                .requiresPrescription(medicine.getRequiresPrescription())
                                .packingUnit(medicine.getPackingUnit())
                                .status(medicine.getStatus())
                                .createdAt(medicine.getCreatedAt())
                                .build();

                if (medicine.getDetail() != null) {
                        response.setBrand(medicine.getDetail().getBrand());
                        response.setManufacturer(medicine.getDetail().getManufacturer());
                        response.setCountryOfOrigin(medicine.getDetail().getCountryOfOrigin());
                        response.setDosageForm(medicine.getDetail().getDosageForm());
                        response.setExpiryDate(medicine.getDetail().getExpiryDate());
                        response.setActiveIngredients(medicine.getDetail().getActiveIngredients());
                        response.setDescription(medicine.getDetail().getDescription());
                        response.setIndications(medicine.getDetail().getIndications());
                        response.setUsageInstruction(medicine.getDetail().getUsageInstruction());
                        response.setContraindications(medicine.getDetail().getContraindications());
                        response.setSideEffects(medicine.getDetail().getSideEffects());
                        response.setPrecautions(medicine.getDetail().getPrecautions());
                        response.setStorageConditions(medicine.getDetail().getStorageConditions());
                }

                // Fetch symptoms from junction table
                List<MedicineSymptom> symptomsJunction = medicineSymptomRepository.findByMedicineId(medicine.getId());
                if (symptomsJunction != null && !symptomsJunction.isEmpty()) {
                        response.setSymptoms(symptomsJunction.stream()
                                        .map(ms -> ms.getSymptom().getName())
                                        .collect(java.util.stream.Collectors.toList()));
                } else {
                        response.setSymptoms(java.util.Collections.emptyList());
                }

                if (medicine.getPrices() != null && !medicine.getPrices().isEmpty()) {
                        MedicinePrice currentPrice = medicine.getPrices().get(0);
                        response.setPrice(currentPrice.getPrice());
                        response.setOriginalPrice(currentPrice.getOriginalPrice());
                        response.setDiscountPercentage(currentPrice.getDiscountPercentage());
                }

                if (medicine.getImages() != null) {
                        response.setImages(
                                        medicine.getImages().stream().map(img -> ProductResponse.ImageInfo.builder()
                                                        .imageUrl(img.getImageUrl())
                                                        .publicId(img.getPublicId())
                                                        .isPrimary(img.getIsPrimary())
                                                        .build())
                                                        .collect(java.util.stream.Collectors.toList()));

                        medicine.getImages().stream()
                                        .filter(MedicineImage::getIsPrimary)
                                        .findFirst()
                                        .ifPresent(img -> response.setPrimaryImageUrl(img.getImageUrl()));
                }

                return response;
        }

        @Override
        public List<ProductResponse> getDeletedProducts() {
                return medicineRepository.findByStatusFalse()
                                .stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional
        @Caching(evict = {
                        @CacheEvict(value = "productList", allEntries = true),
                        @CacheEvict(value = "categoryProductsV2", allEntries = true)
        })
        public void restoreProduct(Long id) {
                Medicine medicine = medicineRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm id: " + id));
                medicine.setStatus(true);
                medicine.setDeletedAt(null);
                medicineRepository.save(medicine);
        }

        @Override
        @Transactional
        @Caching(evict = {
                        @CacheEvict(value = "productList", allEntries = true),
                        @CacheEvict(value = "categoryProductsV2", allEntries = true)
        })
        public void hardDeleteProduct(Long id) {
                Medicine medicine = medicineRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm id: " + id));

                // Xóa ảnh trên Cloudinary trước khi xóa dữ liệu trong DB
                if (medicine.getImages() != null && !medicine.getImages().isEmpty()) {
                        for (MedicineImage image : medicine.getImages()) {
                                if (image.getImageUrl() != null && image.getImageUrl().contains("cloudinary.com")) {
                                        cloudinaryService.deleteImageByUrl(image.getImageUrl());
                                }
                        }
                }

                medicineRepository.deleteById(id);
        }

        private String generateSlug(String name) {
                if (name == null)
                        return "product-" + System.currentTimeMillis();

                // Better slug generation with Vietnamese support
                String normalized = java.text.Normalizer.normalize(name.toLowerCase(), java.text.Normalizer.Form.NFD);
                String pattern = "\\p{InCombiningDiacriticalMarks}+";
                String slug = normalized.replaceAll(pattern, "")
                                .replaceAll("đ", "d")
                                .replaceAll("[^a-z0-9\\s]", "")
                                .replaceAll("\\s+", "-")
                                .replaceAll("-+", "-")
                                .replaceAll("^-|-$", "");

                return slug + "-" + System.currentTimeMillis();
        }

        private String safeTrim(String str, int maxLength) {
                if (str == null)
                        return null;
                String trimmed = str.trim();
                if (trimmed.isEmpty())
                        return null;
                if (trimmed.length() > maxLength)
                        return trimmed.substring(0, maxLength);
                return trimmed;
        }
}

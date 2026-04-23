package com.medcare.productservice.repository;

import com.medcare.productservice.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    Optional<Medicine> findBySlug(String slug);
    Optional<Medicine> findByIdAndStatusTrue(Long id);
    Optional<Medicine> findBySlugAndStatusTrue(String slug);
    List<Medicine> findByStatusTrue();
    org.springframework.data.domain.Page<Medicine> findByStatusTrue(org.springframework.data.domain.Pageable pageable);

    List<Medicine> findByCategoryIdAndStatusTrue(Long categoryId);

    List<Medicine> findTop4ByCategoryIdAndStatusTrueOrderByCreatedAtDesc(Long categoryId);

    List<Medicine> findTop4ByCategoryIdInAndStatusTrueOrderByCreatedAtDesc(List<Long> categoryIds);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM medicines m WHERE m.category_id IN (:categoryIds) AND m.status = true ORDER BY RAND() LIMIT 4", nativeQuery = true)
    List<Medicine> findRandom4ByCategoryIdIn(
            @org.springframework.data.repository.query.Param("categoryIds") List<Long> categoryIds);

    org.springframework.data.domain.Page<Medicine> findByCategoryIdAndStatusTrue(Long categoryId,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Medicine> findByCategoryIdInAndStatusTrue(List<Long> categoryIds,
            org.springframework.data.domain.Pageable pageable);

    List<Medicine> findByNameContainingIgnoreCaseAndStatusTrue(String name);

    org.springframework.data.domain.Page<Medicine> findByNameContainingIgnoreCaseAndStatusTrue(String name,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM medicines m WHERE " +
            "m.status = true AND (m.name LIKE CONCAT('%', :query, '%') " +
            "OR m.slug LIKE CONCAT('%', :query, '%')) " +
            "ORDER BY CASE WHEN m.name LIKE CONCAT(:query, '%') THEN 0 ELSE 1 END, m.name LIMIT 8", nativeQuery = true)
    List<Medicine> findTopSearchSuggestions(@org.springframework.data.repository.query.Param("query") String query);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT m.detail.manufacturer FROM Medicine m WHERE m.detail.manufacturer IS NOT NULL")
    List<String> findDistinctManufacturers();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT m.detail.countryOfOrigin FROM Medicine m WHERE m.detail.countryOfOrigin IS NOT NULL")
    List<String> findDistinctCountriesOfOrigin();

    List<Medicine> findByStatusFalse();
}

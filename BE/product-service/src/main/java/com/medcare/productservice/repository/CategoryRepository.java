package com.medcare.productservice.repository;

import com.medcare.productservice.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByDeletedAtIsNull();
    List<Category> findByDeletedAtIsNotNull();
    
    List<Category> findByParentIdAndDeletedAtIsNull(Long parentId);
    List<Category> findByParentIdIsNullAndDeletedAtIsNull();
    java.util.Optional<Category> findBySlugAndDeletedAtIsNull(String slug);
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM categories c WHERE c.deleted_at IS NULL AND c.name LIKE CONCAT('%', :query, '%') LIMIT 5", nativeQuery = true)
    List<Category> findTopSuggestions(@org.springframework.data.repository.query.Param("query") String query);
}

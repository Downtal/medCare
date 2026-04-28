package com.medcare.userservice.repository;

import com.medcare.userservice.entity.UserHealthMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserHealthMetricRepository extends JpaRepository<UserHealthMetric, Long> {
    List<UserHealthMetric> findByUserIdOrderByRecordedAtDesc(Long userId);
    List<UserHealthMetric> findByUserIdAndTypeOrderByRecordedAtDesc(Long userId, String type);
}

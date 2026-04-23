package com.medcare.userservice.repository;

import com.medcare.userservice.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserProfile u WHERE u.email = :email AND u.deletedAt IS NULL")
    Optional<UserProfile> findByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserProfile u WHERE u.phone = :phone AND u.deletedAt IS NULL")
    Optional<UserProfile> findByPhone(String phone);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) > 0 FROM UserProfile u WHERE u.email = :email AND u.deletedAt IS NULL")
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) > 0 FROM UserProfile u WHERE u.phone = :phone AND u.deletedAt IS NULL")
    boolean existsByPhone(String phone);

    java.util.List<UserProfile> findAllByDeletedAtIsNull();
    java.util.List<UserProfile> findAllByDeletedAtIsNotNull();
}

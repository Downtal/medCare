package com.medcare.authservice.repository;

import com.medcare.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.username = :username AND u.deletedAt IS NULL")
    Optional<User> findByUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.email = :email AND u.deletedAt IS NULL")
    Optional<User> findByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.phone = :phone AND u.deletedAt IS NULL")
    Optional<User> findByPhone(String phone);

    // Tìm kiếm linh hoạt theo bất cứ định danh nào
    default Optional<User> findByIdentifier(String identifier) {
        return findByUsername(identifier)
                .or(() -> findByEmail(identifier))
                .or(() -> findByPhone(identifier));
    }

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) > 0 FROM User u WHERE u.username = :username AND u.deletedAt IS NULL")
    boolean existsByUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) > 0 FROM User u WHERE u.email = :email AND u.deletedAt IS NULL")
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) > 0 FROM User u WHERE u.phone = :phone AND u.deletedAt IS NULL")
    boolean existsByPhone(String phone);

    java.util.List<User> findAllByDeletedAtIsNull();
    java.util.List<User> findAllByDeletedAtIsNotNull();
}

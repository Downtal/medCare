package com.medcare.userservice.repository;

import com.medcare.userservice.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserProfileUserId(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Address a SET a.isDefault = false WHERE a.userProfile.userId = :userId")
    void unsetDefaultAddresses(@org.springframework.data.repository.query.Param("userId") Long userId);
}

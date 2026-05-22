package com.medcare.userservice.service;

import com.medcare.userservice.dto.*;

import java.util.List;

public interface UserService {
    // Profile operations
    UserProfileDto createProfile(CreateProfileRequest request);
    UserProfileDto getProfileByUserId(Long userId);
    UserProfileDto getProfileByEmail(String email); // Added
    List<UserProfileDto> getAllProfiles();
    List<UserProfileDto> getTrashedProfiles();
    UserProfileDto updateProfile(Long userId, UpdateProfileRequest request);
    void deleteProfile(Long userId);
    void restoreProfile(Long userId);
    void hardDeleteProfile(Long userId);

    // Address operations
    AddressDto addAddress(Long userId, CreateAddressRequest request);
    List<AddressDto> getUserAddresses(Long userId);
    AddressDto getAddressById(Long addressId);
    void deleteAddress(Long addressId, Long userId);
    AddressDto updateAddress(Long addressId, Long userId, CreateAddressRequest request);
    
    // Health Note operations
    UserHealthNoteDto getHealthNote(Long userId);
    UserHealthNoteDto updateHealthNote(Long userId, UpdateHealthNoteRequest request);

    // Health Metric operations
    HealthMetricDto addHealthMetric(Long userId, CreateMetricRequest request);
    List<HealthMetricDto> getHealthMetrics(Long userId, String type);
    void deleteHealthMetric(Long userId, Long metricId);
    HealthMetricDto updateHealthMetric(Long userId, Long metricId, CreateMetricRequest request);
}

package com.medcare.userservice.service.impl;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.userservice.dto.*;
import com.medcare.userservice.entity.Address;
import com.medcare.userservice.entity.UserProfile;
import com.medcare.userservice.entity.UserHealthNote;
import com.medcare.userservice.exception.ConflictException;
import com.medcare.userservice.exception.ResourceNotFoundException;
import com.medcare.userservice.repository.AddressRepository;
import com.medcare.userservice.repository.UserProfileRepository;
import com.medcare.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserProfileRepository userProfileRepository;
    private final AddressRepository addressRepository;
    private final com.medcare.userservice.repository.UserHealthNoteRepository userHealthNoteRepository;
    private final com.medcare.userservice.repository.UserHealthMetricRepository userHealthMetricRepository;
    private final com.medcare.userservice.client.AuthClient authClient;

    // ───────────────── Profile operations ─────────────────

    @Override
    @Transactional
    public UserProfileDto createProfile(CreateProfileRequest request) {
        if (userProfileRepository.existsById(request.getUserId())) {
            throw new ConflictException("Hồ sơ (Profile) đã tồn tại cho user_id: " + request.getUserId());
        }
        if (request.getEmail() != null && userProfileRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email đã tồn tại");
        }
        if (request.getPhone() != null && userProfileRepository.existsByPhone(request.getPhone())) {
            throw new ConflictException("Số điện thoại đã tồn tại");
        }

        UserProfile profile = UserProfile.builder()
                .userId(request.getUserId())
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(request.getRole())
                .status(request.getStatus())
                .dateOfBirth(request.getDateOfBirth())
                .build();

        UserProfile saved = userProfileRepository.save(profile);
        return mapToDto(saved);
    }

    @Override
    public UserProfileDto getProfileByUserId(Long userId) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cho user_id: " + userId));
        return mapToDto(profile);
    }

    @Override
    public UserProfileDto getProfileByEmail(String email) {
        UserProfile profile = userProfileRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cho email: " + email));
        return mapToDto(profile);
    }

    @Override
    public List<UserProfileDto> getAllProfiles() {
        return userProfileRepository.findAllByDeletedAtIsNull().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserProfileDto> getTrashedProfiles() {
        return userProfileRepository.findAllByDeletedAtIsNotNull().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequest request) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cho user_id: " + userId));

        if (request.getFullName() != null) profile.setFullName(request.getFullName());
        if (request.getEmail() != null) {
            if (!request.getEmail().equals(profile.getEmail()) && userProfileRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("Email đã tồn tại");
            }
            profile.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            if (!request.getPhone().equals(profile.getPhone()) && userProfileRepository.existsByPhone(request.getPhone())) {
                throw new ConflictException("Số điện thoại đã tồn tại");
            }
            profile.setPhone(request.getPhone());
        }
        if (request.getRole() != null) profile.setRole(request.getRole());
        if (request.getStatus() != null) profile.setStatus(request.getStatus());
        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) profile.setGender(request.getGender());
        
        // SYNC back to auth-service if email, phone, role, or status changed
        if (request.getEmail() != null || request.getPhone() != null || request.getRole() != null || request.getStatus() != null) {
            try {
                authClient.updateCredentials(userId, com.medcare.userservice.client.AuthClient.AuthInternalRequest.builder()
                        .email(profile.getEmail())
                        .phone(profile.getPhone())
                        .role(profile.getRole())
                        .status(profile.getStatus())
                        .build());
            } catch (Exception e) {
                // We log it but don't fail the whole transaction if auth-service is down? 
                // Actually, for data consistency, maybe we should fail? 
                // Given the user's request for sync, I'll let it throw so the transaction rolls back.
                throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể đồng bộ thông tin sang auth-service: " + e.getMessage());
            }
        }

        UserProfile updated = userProfileRepository.save(profile);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteProfile(Long userId) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cho user_id: " + userId));
        user.setDeletedAt(java.time.LocalDateTime.now());
        userProfileRepository.save(user);
    }

    @Override
    @Transactional
    public void restoreProfile(Long userId) {
        UserProfile user = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cho user_id: " + userId));
        user.setDeletedAt(null);
        userProfileRepository.save(user);
    }

    @Override
    @Transactional
    public void hardDeleteProfile(Long userId) {
        userProfileRepository.deleteById(userId);
    }

    // ───────────────── Address operations ─────────────────

    @Override
    @Transactional
    public AddressDto addAddress(Long userId, CreateAddressRequest request) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user_id: " + userId));

        // Logic for default address: If this new address is default, unset others
        if (request.getIsDefault() != null && request.getIsDefault()) {
            addressRepository.unsetDefaultAddresses(userId);
        }

        Address address = Address.builder()
                .userProfile(profile)
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .fullAddress(request.getFullAddress())
                .city(request.getCity())
                .district(request.getDistrict())
                .ward(request.getWard())
                .cityId(request.getCityId())
                .districtId(request.getDistrictId())
                .wardCode(request.getWardCode())
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .build();

        Address saved = addressRepository.save(address);
        return mapToAddressDto(saved);
    }

    @Override
    public List<AddressDto> getUserAddresses(Long userId) {
        if (userId == null) {
            throw new ResourceNotFoundException("User ID is required");
        }
        if (!userProfileRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Profile not found for user_id: " + userId);
        }
        return addressRepository.findByUserProfileUserId(userId).stream()
                .map(this::mapToAddressDto)
                .collect(Collectors.toList());
    }

    @Override
    public AddressDto getAddressById(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
        return mapToAddressDto(address);
    }

    @Override
    @Transactional
    public void deleteAddress(Long addressId, Long userId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
        
        // Ownership Check: Only allow deletion if the address belongs to the user
        if (!address.getUserProfile().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "You do not have permission to delete this address");
        }
        
        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public AddressDto updateAddress(Long addressId, Long userId, CreateAddressRequest request) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
        
        if (!address.getUserProfile().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "You do not have permission to update this address");
        }

        // Logic for default address
        if (request.getIsDefault() != null && request.getIsDefault()) {
            addressRepository.unsetDefaultAddresses(userId);
        }

        address.setReceiverName(request.getReceiverName());
        address.setReceiverPhone(request.getReceiverPhone());
        address.setFullAddress(request.getFullAddress());
        address.setCity(request.getCity());
        address.setDistrict(request.getDistrict());
        address.setWard(request.getWard());
        address.setCityId(request.getCityId());
        address.setDistrictId(request.getDistrictId());
        address.setWardCode(request.getWardCode());
        address.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : false);

        Address updated = addressRepository.save(address);
        return mapToAddressDto(updated);
    }

    // ───────────────── Health Note operations ─────────────────

    @Override
    public UserHealthNoteDto getHealthNote(Long userId) {
        com.medcare.userservice.entity.UserHealthNote note = userHealthNoteRepository.findById(userId)
                .orElse(null);
        return note != null ? mapToHealthNoteDto(note) : null;
    }

    @Override
    @Transactional
    public UserHealthNoteDto updateHealthNote(Long userId, UpdateHealthNoteRequest request) {
        // Try to find existing note first to avoid unnecessary profile fetch if possible
        // But since we need profile to link for new notes, and findById(userId) is usually fast...
        UserHealthNote note = userHealthNoteRepository.findById(userId).orElse(null);
        
        if (note == null) {
            UserProfile profile = userProfileRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cho user_id: " + userId));
            note = new UserHealthNote();
            note.setUserProfile(profile);
            // DO NOT set note.setUserId(userId) manually! @MapsId handles it.
        }
        
        if (request.getAllergies() != null) note.setAllergies(request.getAllergies());
        if (request.getChronicConditions() != null) note.setChronicConditions(request.getChronicConditions());
        if (request.getSpecialStatus() != null) note.setSpecialStatus(request.getSpecialStatus());

        UserHealthNote saved = userHealthNoteRepository.save(note);
        return mapToHealthNoteDto(saved);
    }

    // ───────────────── Health Metric operations ─────────────────

    @Override
    @Transactional
    public HealthMetricDto addHealthMetric(Long userId, CreateMetricRequest request) {
        if (!userProfileRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Profile not found for user_id: " + userId);
        }

        com.medcare.userservice.entity.UserHealthMetric metric = com.medcare.userservice.entity.UserHealthMetric.builder()
                .userId(userId)
                .type(request.getType().toUpperCase())
                .value(request.getValue())
                .unit(request.getUnit())
                .build();

        com.medcare.userservice.entity.UserHealthMetric saved = userHealthMetricRepository.save(metric);
        return mapToMetricDto(saved);
    }

    @Override
    public List<HealthMetricDto> getHealthMetrics(Long userId, String type) {
        List<com.medcare.userservice.entity.UserHealthMetric> metrics;
        if (type != null && !type.isEmpty()) {
            metrics = userHealthMetricRepository.findByUserIdAndTypeOrderByRecordedAtDesc(userId, type.toUpperCase());
        } else {
            metrics = userHealthMetricRepository.findByUserIdOrderByRecordedAtDesc(userId);
        }
        return metrics.stream().map(this::mapToMetricDto).collect(Collectors.toList());
    }

    // ───────────────── Mappers ─────────────────

    private UserProfileDto mapToDto(UserProfile profile) {
        return UserProfileDto.builder()
                .userId(profile.getUserId())
                .fullName(profile.getFullName())
                .username(profile.getUsername())
                .email(profile.getEmail())
                .phone(profile.getPhone())
                .role(profile.getRole())
                .status(profile.getStatus())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .healthNote(profile.getHealthNote() != null ? mapToHealthNoteDto(profile.getHealthNote()) : null)
                .createdAt(profile.getCreatedAt())
                .build();
    }

    private UserHealthNoteDto mapToHealthNoteDto(com.medcare.userservice.entity.UserHealthNote note) {
        return UserHealthNoteDto.builder()
                .userId(note.getUserId())
                .allergies(note.getAllergies())
                .chronicConditions(note.getChronicConditions())
                .specialStatus(note.getSpecialStatus())
                .updatedAt(note.getUpdatedAt())
                .build();
    }

    private AddressDto mapToAddressDto(Address address) {
        return AddressDto.builder()
                .id(address.getId())
                .userId(address.getUserProfile().getUserId())
                .receiverName(address.getReceiverName())
                .receiverPhone(address.getReceiverPhone())
                .fullAddress(address.getFullAddress())
                .city(address.getCity())
                .district(address.getDistrict())
                .ward(address.getWard())
                .cityId(address.getCityId())
                .districtId(address.getDistrictId())
                .wardCode(address.getWardCode())
                .isDefault(address.getIsDefault())
                .build();
    }

    private HealthMetricDto mapToMetricDto(com.medcare.userservice.entity.UserHealthMetric metric) {
        return HealthMetricDto.builder()
                .id(metric.getId())
                .type(metric.getType())
                .value(metric.getValue())
                .unit(metric.getUnit())
                .recordedAt(metric.getRecordedAt())
                .build();
    }
}

package com.medcare.userservice.service.impl;

import com.medcare.userservice.dto.*;
import com.medcare.userservice.entity.Address;
import com.medcare.userservice.entity.UserProfile;
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
            addressRepository.findByUserProfileUserId(userId).forEach(a -> {
                a.setIsDefault(false);
                addressRepository.save(a);
            });
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
            throw new RuntimeException("You do not have permission to delete this address");
        }
        
        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public AddressDto updateAddress(Long addressId, Long userId, CreateAddressRequest request) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
        
        if (!address.getUserProfile().getUserId().equals(userId)) {
            throw new RuntimeException("You do not have permission to update this address");
        }

        // Logic for default address
        if (request.getIsDefault() != null && request.getIsDefault()) {
            addressRepository.findByUserProfileUserId(userId).forEach(a -> {
                a.setIsDefault(false);
                addressRepository.save(a);
            });
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
                .createdAt(profile.getCreatedAt())
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
}

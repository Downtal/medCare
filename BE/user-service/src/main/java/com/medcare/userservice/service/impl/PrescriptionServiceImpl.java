package com.medcare.userservice.service.impl;

import com.medcare.userservice.dto.PrescriptionResponse;
import com.medcare.userservice.entity.Prescription;
import com.medcare.userservice.entity.PrescriptionStatus;
import com.medcare.userservice.exception.ResourceNotFoundException;
import com.medcare.userservice.repository.PrescriptionRepository;
import com.medcare.userservice.repository.UserProfileRepository;
import com.medcare.userservice.service.CloudinaryService;
import com.medcare.userservice.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final CloudinaryService cloudinaryService;
    private final com.medcare.userservice.client.AIClient aiClient;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final com.medcare.userservice.service.NotificationService notificationService;
    private final UserProfileRepository userProfileRepository;

    @Override
    @Transactional
    public PrescriptionResponse uploadPrescription(Long userId, MultipartFile file) throws IOException {
        Map uploadResult = cloudinaryService.upload(file, "medcare/prescriptions");
        String imageUrl = (String) uploadResult.get("url");

        Prescription prescription = Prescription.builder()
                .userId(userId)
                .imageUrl(imageUrl)
                .status(PrescriptionStatus.PENDING)
                .isUsed(false)
                .build();

        Prescription saved = prescriptionRepository.save(prescription);
        return mapToResponse(saved);
    }

    @Override
    public List<PrescriptionResponse> getUserPrescriptions(Long userId) {
        return prescriptionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PrescriptionResponse getPrescriptionById(Long id, Long requesterId, String role) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
                
        // Ownership Check: bypass if requesterId is null (internal service call) 
        // or if user is PHARMACIST/ADMIN
        if (requesterId != null && !"PHARMACIST".equals(role) && !"ADMIN".equals(role)) {
            if (!prescription.getUserId().equals(requesterId)) {
                throw new RuntimeException("Unauthorized: You do not have permission to view this prescription");
            }
        }
                
        return mapToResponse(prescription);
    }

    @Override
    @Transactional
    public PrescriptionResponse updateStatus(Long id, PrescriptionStatus status, String note) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        
        prescription.setStatus(status);
        prescription.setPharmacistNote(note);
        
        // Track when the prescription was approved (for 90-day validity)
        if (status == PrescriptionStatus.APPROVED && prescription.getApprovedAt() == null) {
            prescription.setApprovedAt(java.time.LocalDateTime.now());
        }
        
        Prescription saved = prescriptionRepository.save(prescription);
        
        // Send real-time notification
        notificationService.sendPrescriptionUpdate(saved.getUserId(), status.name(), note);
        
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public PrescriptionResponse markAsUsed(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        
        prescription.setIsUsed(true);
        return mapToResponse(prescriptionRepository.save(prescription));
    }

    @Override
    public List<PrescriptionResponse> getPendingPrescriptions() {
        return prescriptionRepository.findByStatusOrderByCreatedAtAsc(PrescriptionStatus.PENDING)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PrescriptionResponse analyzePrescription(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));

        try {
            java.util.Map<String, String> request = new java.util.HashMap<>();
            request.put("image_url", prescription.getImageUrl());
            
            java.util.Map<String, Object> aiResult = aiClient.analyzePrescription(request);
            
            // Update metadata if provided by AI
            if (aiResult.containsKey("hospital_name") && aiResult.get("hospital_name") != null) {
                prescription.setHospitalName(aiResult.get("hospital_name").toString());
            }
            if (aiResult.containsKey("clinic_name") && aiResult.get("clinic_name") != null) {
                prescription.setClinicName(aiResult.get("clinic_name").toString());
            }
            if (aiResult.containsKey("doctor_name") && aiResult.get("doctor_name") != null) {
                prescription.setDoctorName(aiResult.get("doctor_name").toString());
            }
            if (aiResult.containsKey("expiry_date") && aiResult.get("expiry_date") != null) {
                try {
                    prescription.setExpiryDate(java.time.LocalDate.parse(aiResult.get("expiry_date").toString()));
                } catch (Exception e) {
                    log.warn("Failed to parse expiry date from AI: {}", aiResult.get("expiry_date"));
                }
            }

            // Save the full JSON result
            prescription.setExtractedData(objectMapper.writeValueAsString(aiResult));
            
            return mapToResponse(prescriptionRepository.save(prescription));
        } catch (Exception e) {
            log.error("Failed to analyze prescription {}: {}", id, e.getMessage());
            throw new RuntimeException("AI Analysis failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public PrescriptionResponse resetUsage(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        prescription.setIsUsed(false);
        return mapToResponse(prescriptionRepository.save(prescription));
    }

    @Override
    public List<PrescriptionResponse> getAllPrescriptions() {
        return prescriptionRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PrescriptionResponse updateExtractedData(Long id, String extractedData) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        prescription.setExtractedData(extractedData);
        return mapToResponse(prescriptionRepository.save(prescription));
    }

    @Override
    @Transactional
    public void deletePrescription(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        
        // 1. Delete image from Cloudinary using standardized method
        cloudinaryService.deleteImageByUrl(prescription.getImageUrl());

        // 2. Delete record from database
        prescriptionRepository.delete(prescription);
    }

    @Override
    @Transactional
    public PrescriptionResponse updatePrescriptionInfo(Long id, String hospitalName, String doctorName, String expiryDate) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));

        if (hospitalName != null) prescription.setHospitalName(hospitalName);
        if (doctorName != null) prescription.setDoctorName(doctorName);
        if (expiryDate != null && !expiryDate.isBlank()) {
            try {
                prescription.setExpiryDate(LocalDate.parse(expiryDate));
            } catch (Exception e) {
                // Keep old date if format is invalid
            }
        }

        return mapToResponse(prescriptionRepository.save(prescription));
    }

    @Override
    @Transactional
    public PrescriptionResponse fulfillMedicine(Long prescriptionId, List<Long> purchasedProductIds) {
        Prescription p = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", prescriptionId));
        try {
            Map<String, Object> data = objectMapper.readValue(
                p.getExtractedData() != null ? p.getExtractedData() : "{}", Map.class);
            List<Map<String, Object>> medicines = (List<Map<String, Object>>) data.getOrDefault("mapped_medicines", new ArrayList<>());
            for (Map<String, Object> med : medicines) {
                Object matchedProduct = med.get("matched_product");
                if (matchedProduct instanceof Map) {
                    Object productIdObj = ((Map<?, ?>) matchedProduct).get("id");
                    if (productIdObj != null) {
                        Long productId = Long.valueOf(productIdObj.toString());
                        if (purchasedProductIds.contains(productId)) {
                            med.put("purchased", true);
                        }
                    }
                }
            }
            // Auto-close if ALL matched medicines purchased
            boolean allPurchased = medicines.stream()
                .filter(m -> m.get("matched_product") != null)
                .allMatch(m -> Boolean.TRUE.equals(m.get("purchased")));
            if (allPurchased && !medicines.isEmpty()) {
                p.setIsUsed(true);
            }
            data.put("mapped_medicines", medicines);
            p.setExtractedData(objectMapper.writeValueAsString(data));
        } catch (Exception e) {
            log.error("Failed to fulfill prescription medicines: {}", e.getMessage());
        }
        return mapToResponse(prescriptionRepository.save(p));
    }

    @Override
    @Transactional
    public PrescriptionResponse unfulfillMedicine(Long prescriptionId, List<Long> cancelledProductIds) {
        Prescription p = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", prescriptionId));
        try {
            Map<String, Object> data = objectMapper.readValue(
                p.getExtractedData() != null ? p.getExtractedData() : "{}", Map.class);
            List<Map<String, Object>> medicines = (List<Map<String, Object>>) data.getOrDefault("mapped_medicines", new ArrayList<>());
            for (Map<String, Object> med : medicines) {
                Object matchedProduct = med.get("matched_product");
                if (matchedProduct instanceof Map) {
                    Object productIdObj = ((Map<?, ?>) matchedProduct).get("id");
                    if (productIdObj != null) {
                        Long productId = Long.valueOf(productIdObj.toString());
                        if (cancelledProductIds.contains(productId)) {
                            med.put("purchased", false);
                            // We don't know the exact quantity from just productIds here, 
                            // but in our current system, we only allow one active order.
                            // However, to be safe, we should probably pass a map of productId -> quantity.
                            // For now, let's just reset ordered_quantity to 0 if it was purchased as a whole,
                            // or better, if the user only allows one order, we can reset it.
                            // Actually, let's just reset ordered_quantity to 0 for those items 
                            // because we assume the cancellation reverts the whole reservation.
                            med.put("ordered_quantity", 0);
                        }
                    }
                }
            }
            data.put("mapped_medicines", medicines);
            p.setExtractedData(objectMapper.writeValueAsString(data));
            p.setIsUsed(false); // Definitely not used if we are unfulfilling items
        } catch (Exception e) {
            log.error("Failed to unfulfill prescription medicines: {}", e.getMessage());
        }
        return mapToResponse(prescriptionRepository.save(p));
    }

    @Override
    public String validateMedicineForCart(Long prescriptionId, Long productId) {
        Prescription p = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", prescriptionId));
        // 1. Must be APPROVED
        if (p.getStatus() != PrescriptionStatus.APPROVED) {
            return "Toa thuốc chưa được phê duyệt";
        }
        // 2. Must not be expired
        if (p.getExpiryDate() != null && p.getExpiryDate().isBefore(LocalDate.now())) {
            return "Toa thuốc đã hết hạn";
        }
        // 3. Check per-product purchase history
        try {
            if (p.getExtractedData() != null) {
                Map<String, Object> data = objectMapper.readValue(p.getExtractedData(), Map.class);
                List<Map<String, Object>> medicines = (List<Map<String, Object>>) data.getOrDefault("mapped_medicines", new ArrayList<>());
                for (Map<String, Object> med : medicines) {
                    Object matchedProduct = med.get("matched_product");
                    if (matchedProduct instanceof Map) {
                        Object productIdObj = ((Map<?, ?>) matchedProduct).get("id");
                        if (productIdObj != null && Long.valueOf(productIdObj.toString()).equals(productId)) {
                            if (Boolean.TRUE.equals(med.get("purchased"))) {
                                return "Thuốc này đã được mua trong toa thuốc này rồi";
                            }
                            return null; // OK
                        }
                    }
                }
                return "Sản phẩm này không có trong toa thuốc";
            }
        } catch (Exception e) {
            log.error("Failed to validate medicine for cart: {}", e.getMessage());
        }
        return null;
    }

    private PrescriptionResponse mapToResponse(Prescription p) {
        String userEmail = userProfileRepository.findById(p.getUserId())
                .map(com.medcare.userservice.entity.UserProfile::getEmail)
                .orElse("Chưa xác định");

        return PrescriptionResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .userEmail(userEmail)
                .imageUrl(p.getImageUrl())
                .status(p.getStatus())
                .hospitalName(p.getHospitalName())
                .clinicName(p.getClinicName())
                .doctorName(p.getDoctorName())
                .expiryDate(p.getExpiryDate())
                .isUsed(p.getIsUsed())
                .maxUsage(p.getMaxUsage())
                .currentUsage(p.getCurrentUsage())
                .pharmacistNote(p.getPharmacistNote())
                .extractedData(p.getExtractedData())
                .approvedAt(p.getApprovedAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

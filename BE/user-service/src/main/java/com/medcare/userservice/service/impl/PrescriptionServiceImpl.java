package com.medcare.userservice.service.impl;

import com.medcare.userservice.dto.PrescriptionResponse;
import com.medcare.userservice.entity.Prescription;
import com.medcare.userservice.entity.PrescriptionStatus;
import com.medcare.userservice.exception.ResourceNotFoundException;
import com.medcare.userservice.repository.PrescriptionRepository;
import com.medcare.userservice.service.CloudinaryService;
import com.medcare.userservice.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    private PrescriptionResponse mapToResponse(Prescription p) {
        return PrescriptionResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .imageUrl(p.getImageUrl())
                .status(p.getStatus())
                .hospitalName(p.getHospitalName())
                .clinicName(p.getClinicName())
                .doctorName(p.getDoctorName())
                .expiryDate(p.getExpiryDate())
                .isUsed(p.getIsUsed())
                .pharmacistNote(p.getPharmacistNote())
                .extractedData(p.getExtractedData())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

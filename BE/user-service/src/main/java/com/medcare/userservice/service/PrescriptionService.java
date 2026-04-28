package com.medcare.userservice.service;

import com.medcare.userservice.dto.PrescriptionResponse;
import com.medcare.userservice.entity.PrescriptionStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface PrescriptionService {
    PrescriptionResponse uploadPrescription(Long userId, MultipartFile file) throws IOException;
    List<PrescriptionResponse> getUserPrescriptions(Long userId);
    PrescriptionResponse getPrescriptionById(Long id, Long requesterId, String role);
    PrescriptionResponse updateStatus(Long id, PrescriptionStatus status, String note);
    PrescriptionResponse markAsUsed(Long id);
    List<PrescriptionResponse> getPendingPrescriptions();
    PrescriptionResponse analyzePrescription(Long id);
    PrescriptionResponse resetUsage(Long id);
}

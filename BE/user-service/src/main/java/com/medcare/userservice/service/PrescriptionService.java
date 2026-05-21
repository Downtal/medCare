package com.medcare.userservice.service;

import com.medcare.userservice.dto.PrescriptionResponse;
import com.medcare.userservice.entity.PrescriptionStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface PrescriptionService {
    PrescriptionResponse uploadPrescription(Long userId, MultipartFile file) throws IOException;
    List<PrescriptionResponse> getUserPrescriptions(Long userId);
    List<PrescriptionResponse> getAllPrescriptions();
    PrescriptionResponse getPrescriptionById(Long id, Long requesterId, String role);
    PrescriptionResponse updateStatus(Long id, PrescriptionStatus status, String note);
    PrescriptionResponse markAsUsed(Long id);
    List<PrescriptionResponse> getPendingPrescriptions();
    PrescriptionResponse analyzePrescription(Long id);
    PrescriptionResponse resetUsage(Long id);
    void deletePrescription(Long id);
    PrescriptionResponse updateExtractedData(Long id, String extractedData);
    PrescriptionResponse updatePrescriptionInfo(Long id, String hospitalName, String doctorName, String expiryDate);
    
    /**
     * Called by Order Service after successful payment.
     * Marks specific products as purchased in the prescription's extracted_data.
     */
    PrescriptionResponse fulfillMedicine(Long prescriptionId, List<Long> purchasedProductIds);
    PrescriptionResponse unfulfillMedicine(Long prescriptionId, List<Long> cancelledProductIds);
    
    /**
     * Called to validate if a product can be added to cart from this prescription.
     * Returns error message if not allowed, null if allowed.
     */
    String validateMedicineForCart(Long prescriptionId, Long productId);
}

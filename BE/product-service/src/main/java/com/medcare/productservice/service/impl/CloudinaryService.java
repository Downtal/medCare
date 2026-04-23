package com.medcare.productservice.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public void deleteImageByUrl(String imageUrl) {
        try {
            if (imageUrl == null || !imageUrl.contains("cloudinary.com")) {
                return;
            }

            // Extract public_id from Cloudinary URL
            // Format: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<ext>
            String publicId = extractPublicId(imageUrl);
            if (publicId != null) {
                log.info("Deleting image from Cloudinary with publicId: {}", publicId);
                Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("Cloudinary deletion result: {}", result);
            }
        } catch (Exception e) {
            log.error("Failed to delete image from Cloudinary: {}", imageUrl, e);
        }
    }

    private String extractPublicId(String imageUrl) {
        try {
            // Find the index of "/upload/"
            int uploadIndex = imageUrl.indexOf("/upload/");
            if (uploadIndex == -1) return null;

            String afterUpload = imageUrl.substring(uploadIndex + "/upload/".length());
            
            // Try to skip version if exists (e.g., v123456789/)
            if (afterUpload.matches("^v\\d+/.*")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
            }

            // Remove extension
            int lastDotIndex = afterUpload.lastIndexOf(".");
            if (lastDotIndex != -1) {
                return afterUpload.substring(0, lastDotIndex);
            }
            
            return afterUpload;
        } catch (Exception e) {
            log.error("Failed to extract public_id from URL: {}", imageUrl, e);
            return null;
        }
    }
}

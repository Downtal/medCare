package com.medcare.userservice.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

public interface CloudinaryService {
    Map upload(MultipartFile file, String folder) throws IOException;
    Map delete(String publicId) throws IOException;
    void deleteImageByUrl(String imageUrl);
}

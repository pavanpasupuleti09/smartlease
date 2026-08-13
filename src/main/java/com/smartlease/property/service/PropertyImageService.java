package com.smartlease.property.service;

import com.smartlease.auth.entity.User;
import com.smartlease.property.dto.PropertyImageResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PropertyImageService {

    PropertyImageResponse uploadImage(Long propertyId, MultipartFile file, boolean isPrimary, Integer sortOrder, User caller);

    List<PropertyImageResponse> getImagesByProperty(Long propertyId);

    PropertyImageResponse getImage(Long imageId);

    Resource getImageFile(Long imageId);

    PropertyImageResponse setPrimary(Long imageId, User caller);

    void deleteImage(Long imageId, User caller);
}

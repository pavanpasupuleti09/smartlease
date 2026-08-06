package com.smartlease.property.service;

import com.smartlease.property.dto.PropertyImageResponse;
import com.smartlease.property.entity.Property;
import com.smartlease.property.entity.PropertyImage;
import com.smartlease.property.repository.PropertyImageRepository;
import com.smartlease.property.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class PropertyImageServiceImpl implements PropertyImageService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB
    private static final int MAX_IMAGES_PER_PROPERTY = 10;
    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final PropertyImageRepository imageRepository;
    private final PropertyRepository propertyRepository;
    private final String uploadDir;

    public PropertyImageServiceImpl(PropertyImageRepository imageRepository,
                                    PropertyRepository propertyRepository,
                                    @Value("${app.upload-dir:./uploads/properties}") String uploadDir) {
        this.imageRepository = imageRepository;
        this.propertyRepository = propertyRepository;
        this.uploadDir = uploadDir;
    }

    @Override
    public PropertyImageResponse uploadImage(Long propertyId, MultipartFile file, boolean isPrimary, Integer sortOrder) {

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property Not Found"));

        if (imageRepository.countByPropertyId(propertyId) >= MAX_IMAGES_PER_PROPERTY) {
            throw new RuntimeException("Maximum of " + MAX_IMAGES_PER_PROPERTY + " images allowed per property");
        }
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Image file is empty");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("Only JPG, PNG, WEBP and GIF images are allowed");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new RuntimeException("Image file size exceeds the 5 MB limit");
        }

        String originalFilename = StringUtils.cleanPath(
                Objects.requireNonNullElse(file.getOriginalFilename(), "image"));
        String storedFilename = UUID.randomUUID() + "_" + originalFilename;

        Path propertyDir = Paths.get(uploadDir, String.valueOf(propertyId));
        try {
            Files.createDirectories(propertyDir);
            file.transferTo(propertyDir.resolve(storedFilename).normalize());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store image", e);
        }

        if (isPrimary) {
            unsetPrimary(propertyId);
        }

        PropertyImage image = new PropertyImage();
        image.setProperty(property);
        image.setFilename(originalFilename);
        image.setFilePath(propertyId + "/" + storedFilename);
        image.setFileSize((int) file.getSize());
        image.setContentType(file.getContentType());
        image.setPrimary(isPrimary);
        image.setSortOrder(sortOrder != null ? sortOrder : (int) imageRepository.countByPropertyId(propertyId));

        return toResponse(imageRepository.save(image));
    }

    @Override
    public List<PropertyImageResponse> getImagesByProperty(Long propertyId) {

        return imageRepository.findByPropertyId(propertyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public PropertyImageResponse getImage(Long imageId) {

        return toResponse(imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image Not Found")));
    }

    @Override
    public Resource getImageFile(Long imageId) {

        PropertyImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image Not Found"));

        Path file = Paths.get(uploadDir, image.getFilePath()).normalize();
        Resource resource = new FileSystemResource(file);
        if (!resource.exists()) {
            throw new RuntimeException("Image file not found on disk");
        }
        return resource;
    }

    @Override
    public PropertyImageResponse setPrimary(Long imageId) {

        PropertyImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image Not Found"));

        unsetPrimary(image.getProperty().getId());
        image.setPrimary(true);

        return toResponse(imageRepository.save(image));
    }

    @Override
    public void deleteImage(Long imageId) {

        PropertyImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image Not Found"));

        try {
            Files.deleteIfExists(Paths.get(uploadDir, image.getFilePath()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete image file", e);
        }

        imageRepository.delete(image);
    }

    private void unsetPrimary(Long propertyId) {
        List<PropertyImage> images = imageRepository.findByPropertyId(propertyId);
        images.forEach(image -> image.setPrimary(false));
        imageRepository.saveAll(images);
    }

    private PropertyImageResponse toResponse(PropertyImage image) {

        return new PropertyImageResponse(
                image.getId(),
                image.getProperty().getId(),
                image.getFilename(),
                image.getContentType(),
                image.getFileSize(),
                image.isPrimary(),
                image.getSortOrder()
        );
    }
}

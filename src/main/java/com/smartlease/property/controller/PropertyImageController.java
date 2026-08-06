package com.smartlease.property.controller;

import com.smartlease.property.dto.PropertyImageResponse;
import com.smartlease.property.service.PropertyImageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyImageController {

    private final PropertyImageService imageService;

    public PropertyImageController(PropertyImageService imageService) {
        this.imageService = imageService;
    }

    @PostMapping(value = "/{propertyId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PropertyImageResponse uploadImage(
            @PathVariable Long propertyId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isPrimary", defaultValue = "false") boolean isPrimary,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder) {

        return imageService.uploadImage(propertyId, file, isPrimary, sortOrder);
    }

    @GetMapping("/{propertyId}/images")
    public List<PropertyImageResponse> getImagesByProperty(@PathVariable Long propertyId) {
        return imageService.getImagesByProperty(propertyId);
    }

    @GetMapping("/images/{imageId}/file")
    public ResponseEntity<Resource> getImageFile(@PathVariable Long imageId) {

        PropertyImageResponse meta = imageService.getImage(imageId);
        Resource file = imageService.getImageFile(imageId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + meta.getFilename() + "\"")
                .body(file);
    }

    @PutMapping("/images/{imageId}/primary")
    public PropertyImageResponse setPrimary(@PathVariable Long imageId) {
        return imageService.setPrimary(imageId);
    }

    @DeleteMapping("/images/{imageId}")
    public String deleteImage(@PathVariable Long imageId) {
        imageService.deleteImage(imageId);
        return "Image Deleted Successfully";
    }
}

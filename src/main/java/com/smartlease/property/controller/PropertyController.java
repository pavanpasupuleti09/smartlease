package com.smartlease.property.controller;

import com.smartlease.property.dto.PropertyRequest;
import com.smartlease.property.dto.PropertyResponse;
import com.smartlease.property.service.PropertyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @PostMapping
    public PropertyResponse createProperty(@RequestBody PropertyRequest request) {
        return propertyService.createProperty(request);
    }

    @GetMapping
    public List<PropertyResponse> getAllProperties() {
        return propertyService.getAllProperties();
    }

    @GetMapping("/owner/{ownerId}")
    public List<PropertyResponse> getPropertiesByOwner(@PathVariable Long ownerId) {
        return propertyService.getPropertiesByOwner(ownerId);
    }

    @GetMapping("/{id}")
    public PropertyResponse getPropertyById(@PathVariable Long id) {
        return propertyService.getPropertyById(id);

    }

    @PutMapping("/{id}")
    public PropertyResponse updateProperty(
            @PathVariable Long id,
            @RequestBody PropertyRequest request) {

        return propertyService.updateProperty(id, request);
    }
    @DeleteMapping("/{id}")
    public String deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return "Property Deleted Successfully";
    }
}
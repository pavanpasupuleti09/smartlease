package com.smartlease.property.controller;

import com.smartlease.auth.entity.User;
import com.smartlease.property.dto.PropertyRequest;
import com.smartlease.property.dto.PropertyResponse;
import com.smartlease.property.service.PropertyService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public PropertyResponse createProperty(@RequestBody PropertyRequest request,
                                           @AuthenticationPrincipal User user) {
        return propertyService.createProperty(request, user);
    }

    @GetMapping
    public List<PropertyResponse> getAllProperties() {
        return propertyService.getAllProperties();
    }

    @GetMapping("/owner/{ownerId}")
    public List<PropertyResponse> getPropertiesByOwner(@PathVariable Long ownerId,
                                                       @AuthenticationPrincipal User user) {
        return propertyService.getPropertiesByOwner(user.getId());
    }

    @GetMapping("/{id}")
    public PropertyResponse getPropertyById(@PathVariable Long id) {
        return propertyService.getPropertyById(id);
    }

    @PutMapping("/{id}")
    public PropertyResponse updateProperty(
            @PathVariable Long id,
            @RequestBody PropertyRequest request,
            @AuthenticationPrincipal User user) {

        return propertyService.updateProperty(id, request, user);
    }

    @DeleteMapping("/{id}")
    public String deleteProperty(@PathVariable Long id,
                                 @AuthenticationPrincipal User user) {
        propertyService.deleteProperty(id, user);
        return "Property Deleted Successfully";
    }
}

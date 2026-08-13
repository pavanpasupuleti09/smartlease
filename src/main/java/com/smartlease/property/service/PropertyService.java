package com.smartlease.property.service;

import com.smartlease.auth.entity.User;
import com.smartlease.property.dto.PropertyRequest;
import com.smartlease.property.dto.PropertyResponse;

import java.util.List;

public interface PropertyService {

    PropertyResponse createProperty(PropertyRequest request, User caller);

    List<PropertyResponse> getAllProperties();
    List<PropertyResponse> getPropertiesByOwner(Long ownerId);
    PropertyResponse getPropertyById(Long id);
    PropertyResponse updateProperty(Long id, PropertyRequest request, User caller);
    void deleteProperty(Long id, User caller);

}

package com.smartlease.property.service;

import com.smartlease.property.dto.PropertyRequest;
import com.smartlease.property.dto.PropertyResponse;

import java.util.List;

public interface PropertyService {

    PropertyResponse createProperty(PropertyRequest request);

    List<PropertyResponse> getAllProperties();
    PropertyResponse getPropertyById(Long id);
    PropertyResponse updateProperty(Long id, PropertyRequest request);
    void deleteProperty(Long id);

}
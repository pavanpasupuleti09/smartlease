package com.smartlease.property.service;

import com.smartlease.property.dto.PropertyRequest;
import com.smartlease.property.dto.PropertyResponse;
import com.smartlease.property.entity.Property;
import com.smartlease.property.repository.PropertyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;

    public PropertyServiceImpl(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    @Override
    public PropertyResponse createProperty(PropertyRequest request) {

        Property property = new Property();

        property.setPropertyName(request.getPropertyName());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setState(request.getState());
        property.setPincode(request.getPincode());
        property.setTotalUnits(request.getTotalUnits());
        property.setMonthlyRent(request.getMonthlyRent());
        property.setDescription(request.getDescription());

        Property savedProperty = propertyRepository.save(property);

        return new PropertyResponse(
                savedProperty.getId(),
                savedProperty.getPropertyName(),
                savedProperty.getAddress(),
                savedProperty.getCity(),
                savedProperty.getState(),
                savedProperty.getPincode(),
                savedProperty.getTotalUnits(),
                savedProperty.getMonthlyRent(),
                savedProperty.getDescription()
        );
    }

    @Override
    public List<PropertyResponse> getAllProperties() {

        return propertyRepository.findAll()
                .stream()
                .map(property -> new PropertyResponse(
                        property.getId(),
                        property.getPropertyName(),
                        property.getAddress(),
                        property.getCity(),
                        property.getState(),
                        property.getPincode(),
                        property.getTotalUnits(),
                        property.getMonthlyRent(),
                        property.getDescription()
                ))
                .toList();
    }
    @Override
    public PropertyResponse getPropertyById(Long id) {

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property Not Found"));

        return new PropertyResponse(
                property.getId(),
                property.getPropertyName(),
                property.getAddress(),
                property.getCity(),
                property.getState(),
                property.getPincode(),
                property.getTotalUnits(),
                property.getMonthlyRent(),
                property.getDescription()
        );
    }
    @Override
    public PropertyResponse updateProperty(Long id, PropertyRequest request) {

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property Not Found"));

        property.setPropertyName(request.getPropertyName());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setState(request.getState());
        property.setPincode(request.getPincode());
        property.setTotalUnits(request.getTotalUnits());
        property.setMonthlyRent(request.getMonthlyRent());
        property.setDescription(request.getDescription());

        Property updatedProperty = propertyRepository.save(property);

        return new PropertyResponse(
                updatedProperty.getId(),
                updatedProperty.getPropertyName(),
                updatedProperty.getAddress(),
                updatedProperty.getCity(),
                updatedProperty.getState(),
                updatedProperty.getPincode(),
                updatedProperty.getTotalUnits(),
                updatedProperty.getMonthlyRent(),
                updatedProperty.getDescription()
        );
    }
    @Override
    public void deleteProperty(Long id) {

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        propertyRepository.delete(property);
    }


}
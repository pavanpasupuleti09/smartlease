package com.smartlease.property.service;

import com.smartlease.auth.entity.User;
import com.smartlease.auth.enums.Role;
import com.smartlease.auth.repository.UserRepository;
import com.smartlease.property.dto.PropertyRequest;
import com.smartlease.property.dto.PropertyResponse;
import com.smartlease.property.entity.Property;
import com.smartlease.property.enums.PropertyStatus;
import com.smartlease.property.repository.PropertyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public PropertyServiceImpl(PropertyRepository propertyRepository, UserRepository userRepository) {
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }

    @Override
    public PropertyResponse createProperty(PropertyRequest request, User caller) {

        Property property = new Property();

        property.setPropertyName(request.getPropertyName());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setState(request.getState());
        property.setPincode(request.getPincode());
        property.setTotalUnits(request.getTotalUnits());
        property.setMonthlyRent(request.getMonthlyRent());
        property.setSecurityDeposit(request.getSecurityDeposit());
        property.setDescription(request.getDescription());
        property.setPropertyType(request.getPropertyType());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());
        property.setFurnishing(request.getFurnishing());
        property.setAreaSqft(request.getAreaSqft());
        property.setOwner(resolveOwnerFor(caller, request.getOwnerId(), null));

        Property savedProperty = propertyRepository.save(property);

        return toResponse(savedProperty);
    }

    @Override
    public List<PropertyResponse> getAllProperties() {

        return propertyRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public PropertyResponse getPropertyById(Long id) {

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property Not Found"));

        return toResponse(property);
    }

    @Override
    public PropertyResponse updateProperty(Long id, PropertyRequest request, User caller) {

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property Not Found"));

        assertCanModify(property, caller, "update");

        property.setPropertyName(request.getPropertyName());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setState(request.getState());
        property.setPincode(request.getPincode());
        property.setTotalUnits(request.getTotalUnits());
        property.setMonthlyRent(request.getMonthlyRent());
        property.setSecurityDeposit(request.getSecurityDeposit());
        property.setDescription(request.getDescription());
        property.setPropertyType(request.getPropertyType());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());
        property.setFurnishing(request.getFurnishing());
        property.setAreaSqft(request.getAreaSqft());
        property.setOwner(resolveOwnerFor(caller, request.getOwnerId(), property.getOwner()));

        Property updatedProperty = propertyRepository.save(property);

        return toResponse(updatedProperty);
    }

    @Override
    public void deleteProperty(Long id, User caller) {

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        assertCanModify(property, caller, "delete");

        propertyRepository.delete(property);
    }

    /**
     * Only the property owner or an ADMIN may modify or delete a property.
     * A property with no owner can only be managed by an ADMIN.
     */
    private void assertCanModify(Property property, User caller, String action) {

        boolean isOwner = property.getOwner() != null
                && property.getOwner().getId().equals(caller.getId());
        boolean isAdmin = caller.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Only the owner of the property can " + action + " this property");
        }
    }

    @Override
    public List<PropertyResponse> getPropertiesByOwner(Long ownerId) {

        return propertyRepository.findByOwnerId(ownerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * The property owner is the authenticated caller. Only an ADMIN may designate a
     * different owner via the request body. A supplied ownerId is never honored for
     * non-admin callers.
     */
    private User resolveOwnerFor(User caller, Long requestedOwnerId, User currentOwner) {

        if (caller.getRole() == Role.ADMIN && requestedOwnerId != null) {
            return userRepository.findById(requestedOwnerId)
                    .orElseThrow(() -> new RuntimeException("Owner Not Found"));
        }

        if (caller.getRole() == Role.ADMIN && currentOwner != null) {
            return currentOwner;
        }

        return caller;
    }

    private PropertyResponse toResponse(Property property) {

        return new PropertyResponse(
                property.getId(),
                property.getPropertyName(),
                property.getAddress(),
                property.getCity(),
                property.getState(),
                property.getPincode(),
                property.getTotalUnits(),
                property.getMonthlyRent(),
                property.getSecurityDeposit(),
                property.getDescription(),
                property.getPropertyType(),
                property.getBedrooms(),
                property.getBathrooms(),
                property.getFurnishing(),
                property.getAreaSqft(),
                property.getOwner() != null ? property.getOwner().getId() : null,
                property.getOwner() != null ? property.getOwner().getFullName() : null,
                property.getStatus() != null ? property.getStatus() : PropertyStatus.AVAILABLE
        );
    }
}

package com.smartlease.rentalrequest.service;

import com.smartlease.auth.entity.User;
import com.smartlease.auth.enums.Role;
import com.smartlease.auth.repository.UserRepository;
import com.smartlease.lease.repository.LeaseRepository;
import com.smartlease.property.entity.Property;
import com.smartlease.property.repository.PropertyRepository;
import com.smartlease.rentalrequest.dto.RentalRequestRequest;
import com.smartlease.rentalrequest.dto.RentalRequestResponse;
import com.smartlease.rentalrequest.entity.RentalRequest;
import com.smartlease.rentalrequest.enums.RentalRequestStatus;
import com.smartlease.rentalrequest.repository.RentalRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RentalRequestServiceImpl implements RentalRequestService {

    private final RentalRequestRepository rentalRequestRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final LeaseRepository leaseRepository;

    public RentalRequestServiceImpl(RentalRequestRepository rentalRequestRepository,
                                    UserRepository userRepository,
                                    PropertyRepository propertyRepository,
                                    LeaseRepository leaseRepository) {
        this.rentalRequestRepository = rentalRequestRepository;
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.leaseRepository = leaseRepository;
    }

    @Override
    @Transactional
    public RentalRequestResponse createRequest(RentalRequestRequest request) {

        User tenant = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        if (tenant.getRole() != Role.TENANT) {
            throw new RuntimeException("Only users with TENANT role can create rental requests");
        }

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getOwner() == null) {
            throw new RuntimeException("Property has no owner and cannot be requested");
        }

        boolean hasPendingRequest = rentalRequestRepository
                .existsByTenantIdAndPropertyIdAndStatus(
                        tenant.getId(), property.getId(), RentalRequestStatus.PENDING);

        if (hasPendingRequest) {
            throw new RuntimeException("A pending rental request already exists for this property");
        }

        RentalRequest rentalRequest = new RentalRequest();
        rentalRequest.setTenant(tenant);
        rentalRequest.setProperty(property);
        rentalRequest.setStatus(RentalRequestStatus.PENDING);
        rentalRequest.setCreatedAt(LocalDateTime.now());

        return toResponse(rentalRequestRepository.save(rentalRequest));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalRequestResponse> getRequestsByTenant(Long tenantId) {

        return rentalRequestRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalRequestResponse> getRequestsByOwner(Long ownerId) {

        return rentalRequestRepository.findByProperty_Owner_IdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RentalRequestResponse respondToRequest(Long requestId,
                                                  Long ownerId,
                                                  RentalRequestStatus decision,
                                                  String rejectionReason) {

        RentalRequest rentalRequest = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Rental request not found"));

        Property property = rentalRequest.getProperty();

        if (property.getOwner() == null || !property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Only the owner of the property can respond to this request");
        }

        if (rentalRequest.getStatus() != RentalRequestStatus.PENDING) {
            throw new RuntimeException("Only pending rental requests can be responded to");
        }

        if (decision == RentalRequestStatus.ACCEPTED) {

            if (!isPropertyAvailable(property)) {
                throw new RuntimeException("Property is no longer available");
            }
            rentalRequest.setStatus(RentalRequestStatus.ACCEPTED);

        } else if (decision == RentalRequestStatus.REJECTED) {

            rentalRequest.setStatus(RentalRequestStatus.REJECTED);
            rentalRequest.setRejectionReason(rejectionReason);

        } else {

            throw new RuntimeException("Invalid decision, must be ACCEPTED or REJECTED");
        }

        rentalRequest.setUpdatedAt(LocalDateTime.now());

        return toResponse(rentalRequestRepository.save(rentalRequest));
    }

    private boolean isPropertyAvailable(Property property) {

        boolean alreadyAccepted = rentalRequestRepository
                .existsByPropertyIdAndStatus(property.getId(), RentalRequestStatus.ACCEPTED);

        boolean alreadyLeased = leaseRepository.findAll().stream()
                .anyMatch(lease -> lease.getProperty() != null
                        && lease.getProperty().getId().equals(property.getId())
                        && isLeaseActive(lease.getEndDate()));

        return !alreadyAccepted && !alreadyLeased;
    }

    private boolean isLeaseActive(LocalDate endDate) {
        return endDate == null || !endDate.isBefore(LocalDate.now());
    }

    private RentalRequestResponse toResponse(RentalRequest rentalRequest) {

        User tenant = rentalRequest.getTenant();
        Property property = rentalRequest.getProperty();

        return new RentalRequestResponse(
                rentalRequest.getId(),
                tenant.getId(),
                tenant.getFullName(),
                property.getId(),
                property.getPropertyName(),
                rentalRequest.getStatus(),
                rentalRequest.getCreatedAt(),
                rentalRequest.getRejectionReason()
        );
    }
}

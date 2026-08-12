package com.smartlease.rentalrequest.service;

import com.smartlease.auth.entity.User;
import com.smartlease.auth.enums.Role;
import com.smartlease.auth.repository.UserRepository;
import com.smartlease.lease.dto.LeaseRequest;
import com.smartlease.lease.enums.LeaseStatus;
import com.smartlease.lease.repository.LeaseRepository;
import com.smartlease.lease.service.LeaseService;
import com.smartlease.property.entity.Property;
import com.smartlease.property.enums.PropertyStatus;
import com.smartlease.property.repository.PropertyRepository;
import com.smartlease.rentalrequest.dto.RentalRequestRequest;
import com.smartlease.rentalrequest.dto.RentalRequestResponse;
import com.smartlease.rentalrequest.entity.RentalRequest;
import com.smartlease.rentalrequest.enums.RentalRequestStatus;
import com.smartlease.rentalrequest.repository.RentalRequestRepository;
import com.smartlease.tenant.entity.Tenant;
import com.smartlease.tenant.repository.TenantRepository;
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
    private final TenantRepository tenantRepository;
    private final LeaseService leaseService;

    public RentalRequestServiceImpl(RentalRequestRepository rentalRequestRepository,
                                    UserRepository userRepository,
                                    PropertyRepository propertyRepository,
                                    LeaseRepository leaseRepository,
                                    TenantRepository tenantRepository,
                                    LeaseService leaseService) {
        this.rentalRequestRepository = rentalRequestRepository;
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.leaseRepository = leaseRepository;
        this.tenantRepository = tenantRepository;
        this.leaseService = leaseService;
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

            createLeaseForAcceptedRequest(rentalRequest, property);

            property.setStatus(PropertyStatus.RENTED);
            propertyRepository.save(property);

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

    private void createLeaseForAcceptedRequest(RentalRequest rentalRequest, Property property) {

        User tenantUser = rentalRequest.getTenant();

        Tenant tenant = tenantRepository.findByEmail(tenantUser.getEmail())
                .orElseGet(() -> {
                    Tenant newTenant = new Tenant();
                    newTenant.setFullName(tenantUser.getFullName());
                    newTenant.setEmail(tenantUser.getEmail());
                    return tenantRepository.save(newTenant);
                });

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusMonths(11);

        Double monthlyRent = property.getMonthlyRent();
        Double securityDeposit = property.getSecurityDeposit() != null
                ? property.getSecurityDeposit()
                : monthlyRent * 2;

        LeaseRequest leaseRequest = new LeaseRequest();
        leaseRequest.setPropertyId(property.getId());
        leaseRequest.setTenantId(tenant.getId());
        leaseRequest.setStartDate(startDate);
        leaseRequest.setEndDate(endDate);
        leaseRequest.setMonthlyRent(monthlyRent);
        leaseRequest.setSecurityDeposit(securityDeposit);

        leaseService.createLease(leaseRequest);
    }

    private boolean isPropertyAvailable(Property property) {

        boolean alreadyAccepted = rentalRequestRepository
                .existsByPropertyIdAndStatus(property.getId(), RentalRequestStatus.ACCEPTED);

        boolean alreadyLeased = leaseRepository
                .existsByPropertyIdAndStatus(property.getId(), LeaseStatus.ACTIVE);

        boolean alreadyRented = property.getStatus() == PropertyStatus.RENTED;

        return !alreadyAccepted && !alreadyLeased && !alreadyRented;
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

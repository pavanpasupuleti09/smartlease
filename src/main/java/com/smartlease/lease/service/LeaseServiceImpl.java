package com.smartlease.lease.service;

import com.smartlease.lease.dto.LeaseRequest;
import com.smartlease.lease.dto.LeaseResponse;
import com.smartlease.lease.entity.Lease;
import com.smartlease.lease.repository.LeaseRepository;
import com.smartlease.property.entity.Property;
import com.smartlease.property.repository.PropertyRepository;
import com.smartlease.tenant.entity.Tenant;
import com.smartlease.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaseServiceImpl implements LeaseService {

    private final LeaseRepository leaseRepository;
    private final PropertyRepository propertyRepository;
    private final TenantRepository tenantRepository;

    public LeaseServiceImpl(LeaseRepository leaseRepository,
                            PropertyRepository propertyRepository,
                            TenantRepository tenantRepository) {

        this.leaseRepository = leaseRepository;
        this.propertyRepository = propertyRepository;
        this.tenantRepository = tenantRepository;
    }

    @Override
    public LeaseResponse createLease(LeaseRequest request) {

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        Tenant tenant = tenantRepository.findById(request.getTenantId())
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Lease lease = new Lease();

        lease.setProperty(property);
        lease.setTenant(tenant);
        lease.setStartDate(request.getStartDate());
        lease.setEndDate(request.getEndDate());
        lease.setMonthlyRent(request.getMonthlyRent());
        lease.setSecurityDeposit(request.getSecurityDeposit());

        Lease savedLease = leaseRepository.save(lease);

        return new LeaseResponse(
                savedLease.getId(),
                property.getId(),
                property.getPropertyName(),
                tenant.getId(),
                tenant.getFullName(),
                savedLease.getStartDate(),
                savedLease.getEndDate(),
                savedLease.getMonthlyRent(),
                savedLease.getSecurityDeposit()
        );
    }

    @Override
    public List<LeaseResponse> getAllLeases() {

        return leaseRepository.findAll()
                .stream()
                .map(lease -> new LeaseResponse(
                        lease.getId(),
                        lease.getProperty().getId(),
                        lease.getProperty().getPropertyName(),
                        lease.getTenant().getId(),
                        lease.getTenant().getFullName(),
                        lease.getStartDate(),
                        lease.getEndDate(),
                        lease.getMonthlyRent(),
                        lease.getSecurityDeposit()
                ))
                .toList();
    }

    @Override
    public LeaseResponse getLeaseById(Long id) {

        Lease lease = leaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lease not found"));

        return new LeaseResponse(
                lease.getId(),
                lease.getProperty().getId(),
                lease.getProperty().getPropertyName(),
                lease.getTenant().getId(),
                lease.getTenant().getFullName(),
                lease.getStartDate(),
                lease.getEndDate(),
                lease.getMonthlyRent(),
                lease.getSecurityDeposit()
        );
    }

    @Override
    public LeaseResponse updateLease(Long id, LeaseRequest request) {

        Lease lease = leaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lease not found"));

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        Tenant tenant = tenantRepository.findById(request.getTenantId())
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        lease.setProperty(property);
        lease.setTenant(tenant);
        lease.setStartDate(request.getStartDate());
        lease.setEndDate(request.getEndDate());
        lease.setMonthlyRent(request.getMonthlyRent());
        lease.setSecurityDeposit(request.getSecurityDeposit());

        Lease updatedLease = leaseRepository.save(lease);

        return new LeaseResponse(
                updatedLease.getId(),
                property.getId(),
                property.getPropertyName(),
                tenant.getId(),
                tenant.getFullName(),
                updatedLease.getStartDate(),
                updatedLease.getEndDate(),
                updatedLease.getMonthlyRent(),
                updatedLease.getSecurityDeposit()
        );
    }

    @Override
    public void deleteLease(Long id) {

        Lease lease = leaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lease not found"));

        leaseRepository.delete(lease);
    }
}
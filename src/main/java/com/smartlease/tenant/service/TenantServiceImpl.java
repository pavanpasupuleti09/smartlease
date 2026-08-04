package com.smartlease.tenant.service;

import com.smartlease.tenant.dto.TenantRequest;
import com.smartlease.tenant.dto.TenantResponse;
import com.smartlease.tenant.entity.Tenant;
import com.smartlease.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;

    public TenantServiceImpl(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    public TenantResponse createTenant(TenantRequest request) {

        Tenant tenant = new Tenant();

        tenant.setFullName(request.getFullName());
        tenant.setEmail(request.getEmail());
        tenant.setPhone(request.getPhone());
        tenant.setAadhaarNumber(request.getAadhaarNumber());

        Tenant savedTenant = tenantRepository.save(tenant);

        return new TenantResponse(
                savedTenant.getId(),
                savedTenant.getFullName(),
                savedTenant.getEmail(),
                savedTenant.getPhone(),
                savedTenant.getAadhaarNumber()
        );
    }
    @Override
    public List<TenantResponse> getAllTenants() {

        return tenantRepository.findAll()
                .stream()
                .map(tenant -> new TenantResponse(
                        tenant.getId(),
                        tenant.getFullName(),
                        tenant.getEmail(),
                        tenant.getPhone(),
                        tenant.getAadhaarNumber()
                ))
                .toList();
    }
    @Override
    public TenantResponse getTenantById(Long id) {

        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        return new TenantResponse(
                tenant.getId(),
                tenant.getFullName(),
                tenant.getEmail(),
                tenant.getPhone(),
                tenant.getAadhaarNumber()
        );
    }
    @Override
    public TenantResponse updateTenant(Long id, TenantRequest request) {

        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        tenant.setFullName(request.getFullName());
        tenant.setEmail(request.getEmail());
        tenant.setPhone(request.getPhone());
        tenant.setAadhaarNumber(request.getAadhaarNumber());

        Tenant updatedTenant = tenantRepository.save(tenant);

        return new TenantResponse(
                updatedTenant.getId(),
                updatedTenant.getFullName(),
                updatedTenant.getEmail(),
                updatedTenant.getPhone(),
                updatedTenant.getAadhaarNumber()
        );
    }
    @Override
    public void deleteTenant(Long id) {

        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        tenantRepository.delete(tenant);
    }
}
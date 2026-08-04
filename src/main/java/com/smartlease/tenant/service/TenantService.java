package com.smartlease.tenant.service;

import com.smartlease.tenant.dto.TenantRequest;
import com.smartlease.tenant.dto.TenantResponse;

import java.util.List;

public interface TenantService {

    TenantResponse createTenant(TenantRequest request);

    List<TenantResponse> getAllTenants();

    TenantResponse getTenantById(Long id);

    TenantResponse updateTenant(Long id, TenantRequest request);

    void deleteTenant(Long id);
}
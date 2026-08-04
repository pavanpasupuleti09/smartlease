package com.smartlease.tenant.controller;

import com.smartlease.tenant.dto.TenantRequest;
import com.smartlease.tenant.dto.TenantResponse;
import com.smartlease.tenant.service.TenantService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping
    public TenantResponse createTenant(@RequestBody TenantRequest request) {
        return tenantService.createTenant(request);
    }

    @GetMapping
    public List<TenantResponse> getAllTenants() {
        return tenantService.getAllTenants();
    }

    @GetMapping("/{id}")
    public TenantResponse getTenantById(@PathVariable Long id) {
        return tenantService.getTenantById(id);
    }

    @PutMapping("/{id}")
    public TenantResponse updateTenant(@PathVariable Long id,
                                       @RequestBody TenantRequest request) {
        return tenantService.updateTenant(id, request);
    }

    @DeleteMapping("/{id}")
    public String deleteTenant(@PathVariable Long id) {
        tenantService.deleteTenant(id);
        return "Tenant Deleted Successfully";
    }
}
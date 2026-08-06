package com.smartlease.maintenance.service;

import com.smartlease.maintenance.dto.MaintenanceRequest;
import com.smartlease.maintenance.dto.MaintenanceResponse;
import com.smartlease.maintenance.entity.Maintenance;
import com.smartlease.maintenance.repository.MaintenanceRepository;
import com.smartlease.property.entity.Property;
import com.smartlease.property.repository.PropertyRepository;
import com.smartlease.tenant.entity.Tenant;
import com.smartlease.tenant.repository.TenantRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final PropertyRepository propertyRepository;
    private final TenantRepository tenantRepository;

    public MaintenanceServiceImpl(MaintenanceRepository maintenanceRepository,
                                  PropertyRepository propertyRepository,
                                  TenantRepository tenantRepository) {

        this.maintenanceRepository = maintenanceRepository;
        this.propertyRepository = propertyRepository;
        this.tenantRepository = tenantRepository;
    }

    @Override
    public MaintenanceResponse createMaintenance(MaintenanceRequest request) {

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        Tenant tenant = tenantRepository.findById(request.getTenantId())
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        Maintenance maintenance = new Maintenance();

        maintenance.setProperty(property);
        maintenance.setTenant(tenant);
        maintenance.setIssueTitle(request.getIssueTitle());
        maintenance.setDescription(request.getDescription());
        maintenance.setStatus(request.getStatus());

        Maintenance saved = maintenanceRepository.save(maintenance);

        return new MaintenanceResponse(
                saved.getId(),
                property.getId(),
                property.getPropertyName(),
                tenant.getId(),
                tenant.getFullName(),
                saved.getIssueTitle(),
                saved.getDescription(),
                saved.getStatus()
        );
    }

    @Override
    public List<MaintenanceResponse> getAllMaintenance() {

        return maintenanceRepository.findAll()
                .stream()
                .map(m -> new MaintenanceResponse(
                        m.getId(),
                        m.getProperty().getId(),
                        m.getProperty().getPropertyName(),
                        m.getTenant().getId(),
                        m.getTenant().getFullName(),
                        m.getIssueTitle(),
                        m.getDescription(),
                        m.getStatus()
                ))
                .toList();
    }

    @Override
    public MaintenanceResponse getMaintenanceById(Long id) {

        Maintenance m = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance not found"));

        return new MaintenanceResponse(
                m.getId(),
                m.getProperty().getId(),
                m.getProperty().getPropertyName(),
                m.getTenant().getId(),
                m.getTenant().getFullName(),
                m.getIssueTitle(),
                m.getDescription(),
                m.getStatus()
        );
    }

    @Override
    public MaintenanceResponse updateMaintenance(Long id,
                                                 MaintenanceRequest request) {

        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance not found"));

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        Tenant tenant = tenantRepository.findById(request.getTenantId())
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        maintenance.setProperty(property);
        maintenance.setTenant(tenant);
        maintenance.setIssueTitle(request.getIssueTitle());
        maintenance.setDescription(request.getDescription());
        maintenance.setStatus(request.getStatus());

        Maintenance updated = maintenanceRepository.save(maintenance);

        return new MaintenanceResponse(
                updated.getId(),
                property.getId(),
                property.getPropertyName(),
                tenant.getId(),
                tenant.getFullName(),
                updated.getIssueTitle(),
                updated.getDescription(),
                updated.getStatus()
        );
    }

    @Override
    public void deleteMaintenance(Long id) {

        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance not found"));

        maintenanceRepository.delete(maintenance);
    }
}
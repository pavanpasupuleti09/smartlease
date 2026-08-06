package com.smartlease.maintenance.service;

import com.smartlease.maintenance.dto.MaintenanceRequest;
import com.smartlease.maintenance.dto.MaintenanceResponse;

import java.util.List;

public interface MaintenanceService {

    MaintenanceResponse createMaintenance(MaintenanceRequest request);

    List<MaintenanceResponse> getAllMaintenance();

    MaintenanceResponse getMaintenanceById(Long id);

    MaintenanceResponse updateMaintenance(Long id,
                                          MaintenanceRequest request);

    void deleteMaintenance(Long id);
}
package com.smartlease.maintenance.controller;

import com.smartlease.maintenance.dto.MaintenanceRequest;
import com.smartlease.maintenance.dto.MaintenanceResponse;
import com.smartlease.maintenance.service.MaintenanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @PostMapping
    public MaintenanceResponse createMaintenance(@RequestBody MaintenanceRequest request) {
        return maintenanceService.createMaintenance(request);
    }

    @GetMapping
    public List<MaintenanceResponse> getAllMaintenance() {
        return maintenanceService.getAllMaintenance();
    }

    @GetMapping("/{id}")
    public MaintenanceResponse getMaintenanceById(@PathVariable Long id) {
        return maintenanceService.getMaintenanceById(id);
    }

    @PutMapping("/{id}")
    public MaintenanceResponse updateMaintenance(@PathVariable Long id,
                                                 @RequestBody MaintenanceRequest request) {
        return maintenanceService.updateMaintenance(id, request);
    }

    @DeleteMapping("/{id}")
    public String deleteMaintenance(@PathVariable Long id) {
        maintenanceService.deleteMaintenance(id);
        return "Maintenance Request Deleted Successfully";
    }
}
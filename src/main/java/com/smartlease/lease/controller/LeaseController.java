package com.smartlease.lease.controller;

import com.smartlease.lease.dto.LeaseRequest;
import com.smartlease.lease.dto.LeaseResponse;
import com.smartlease.lease.service.LeaseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leases")
public class LeaseController {

    private final LeaseService leaseService;

    public LeaseController(LeaseService leaseService) {
        this.leaseService = leaseService;
    }

    @PostMapping
    public LeaseResponse createLease(@RequestBody LeaseRequest request) {
        return leaseService.createLease(request);
    }

    @GetMapping
    public List<LeaseResponse> getAllLeases() {
        return leaseService.getAllLeases();
    }

    @GetMapping("/{id}")
    public LeaseResponse getLeaseById(@PathVariable Long id) {
        return leaseService.getLeaseById(id);
    }

    @PutMapping("/{id}")
    public LeaseResponse updateLease(@PathVariable Long id,
                                     @RequestBody LeaseRequest request) {
        return leaseService.updateLease(id, request);
    }

    @DeleteMapping("/{id}")
    public String deleteLease(@PathVariable Long id) {
        leaseService.deleteLease(id);
        return "Lease Deleted Successfully";
    }
}
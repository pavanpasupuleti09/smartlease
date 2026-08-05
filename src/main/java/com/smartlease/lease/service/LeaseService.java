package com.smartlease.lease.service;

import com.smartlease.lease.dto.LeaseRequest;
import com.smartlease.lease.dto.LeaseResponse;

import java.util.List;

public interface LeaseService {

    LeaseResponse createLease(LeaseRequest request);

    List<LeaseResponse> getAllLeases();

    LeaseResponse getLeaseById(Long id);

    LeaseResponse updateLease(Long id, LeaseRequest request);

    void deleteLease(Long id);
}
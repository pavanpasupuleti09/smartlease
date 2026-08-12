package com.smartlease.lease.repository;

import com.smartlease.lease.entity.Lease;
import com.smartlease.lease.enums.LeaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaseRepository extends JpaRepository<Lease, Long> {

    boolean existsByPropertyIdAndStatus(Long propertyId, LeaseStatus status);
}
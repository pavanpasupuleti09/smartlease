package com.smartlease.rentalrequest.repository;

import com.smartlease.rentalrequest.entity.RentalRequest;
import com.smartlease.rentalrequest.enums.RentalRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RentalRequestRepository extends JpaRepository<RentalRequest, Long> {

    List<RentalRequest> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    List<RentalRequest> findByProperty_Owner_IdOrderByCreatedAtDesc(Long ownerId);

    boolean existsByTenantIdAndPropertyIdAndStatus(Long tenantId, Long propertyId, RentalRequestStatus status);

    boolean existsByPropertyIdAndStatus(Long propertyId, RentalRequestStatus status);
}

package com.smartlease.rentalrequest.service;

import com.smartlease.rentalrequest.dto.RentalRequestRequest;
import com.smartlease.rentalrequest.dto.RentalRequestResponse;
import com.smartlease.rentalrequest.enums.RentalRequestStatus;

import java.util.List;

public interface RentalRequestService {

    RentalRequestResponse createRequest(RentalRequestRequest request);

    List<RentalRequestResponse> getRequestsByTenant(Long tenantId);

    List<RentalRequestResponse> getRequestsByOwner(Long ownerId);

    RentalRequestResponse respondToRequest(Long requestId, Long ownerId,
                                           RentalRequestStatus decision,
                                           String rejectionReason);
}

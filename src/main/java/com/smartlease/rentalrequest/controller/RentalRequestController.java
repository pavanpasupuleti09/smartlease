package com.smartlease.rentalrequest.controller;

import com.smartlease.rentalrequest.dto.RentalRequestRequest;
import com.smartlease.rentalrequest.dto.RentalRequestRespondRequest;
import com.smartlease.rentalrequest.dto.RentalRequestResponse;
import com.smartlease.rentalrequest.service.RentalRequestService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rental-requests")
public class RentalRequestController {

    private final RentalRequestService rentalRequestService;

    public RentalRequestController(RentalRequestService rentalRequestService) {
        this.rentalRequestService = rentalRequestService;
    }

    @PostMapping
    public RentalRequestResponse createRentalRequest(@RequestBody RentalRequestRequest request) {
        return rentalRequestService.createRequest(request);
    }

    @GetMapping("/tenant/{tenantId}")
    public List<RentalRequestResponse> getRequestsByTenant(@PathVariable Long tenantId) {
        return rentalRequestService.getRequestsByTenant(tenantId);
    }

    @GetMapping("/owner/{ownerId}")
    public List<RentalRequestResponse> getRequestsByOwner(@PathVariable Long ownerId) {
        return rentalRequestService.getRequestsByOwner(ownerId);
    }

    @PutMapping("/{requestId}/respond")
    public RentalRequestResponse respondToRequest(
            @PathVariable Long requestId,
            @RequestBody RentalRequestRespondRequest request) {

        return rentalRequestService.respondToRequest(
                requestId,
                request.getOwnerId(),
                request.getDecision(),
                request.getRejectionReason()
        );
    }
}

package com.smartlease.rentalrequest.controller;

import com.smartlease.auth.entity.User;
import com.smartlease.rentalrequest.dto.RentalRequestRequest;
import com.smartlease.rentalrequest.dto.RentalRequestRespondRequest;
import com.smartlease.rentalrequest.dto.RentalRequestResponse;
import com.smartlease.rentalrequest.service.RentalRequestService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public RentalRequestResponse createRentalRequest(@RequestBody RentalRequestRequest request,
                                                     @AuthenticationPrincipal User user) {
        return rentalRequestService.createRequest(user, request);
    }

    @GetMapping("/tenant/{tenantId}")
    public List<RentalRequestResponse> getRequestsByTenant(@PathVariable Long tenantId,
                                                           @AuthenticationPrincipal User user) {
        return rentalRequestService.getRequestsByTenant(user.getId());
    }

    @GetMapping("/owner/{ownerId}")
    public List<RentalRequestResponse> getRequestsByOwner(@PathVariable Long ownerId,
                                                          @AuthenticationPrincipal User user) {
        return rentalRequestService.getRequestsByOwner(user.getId());
    }

    @PutMapping("/{requestId}/respond")
    public RentalRequestResponse respondToRequest(
            @PathVariable Long requestId,
            @RequestBody RentalRequestRespondRequest request,
            @AuthenticationPrincipal User user) {

        return rentalRequestService.respondToRequest(
                requestId,
                user.getId(),
                request.getDecision(),
                request.getRejectionReason()
        );
    }
}

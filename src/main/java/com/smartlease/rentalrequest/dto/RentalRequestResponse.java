package com.smartlease.rentalrequest.dto;

import com.smartlease.rentalrequest.enums.RentalRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class RentalRequestResponse {

    private Long id;
    private Long tenantId;
    private String tenantName;
    private Long propertyId;
    private String propertyName;
    private RentalRequestStatus status;
    private LocalDateTime createdAt;
    private String rejectionReason;
}

package com.smartlease.lease.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class LeaseRequest {

    private Long propertyId;
    private Long tenantId;

    private LocalDate startDate;
    private LocalDate endDate;

    private Double monthlyRent;
    private Double securityDeposit;
}
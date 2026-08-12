package com.smartlease.lease.dto;

import com.smartlease.lease.enums.LeaseStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
public class LeaseResponse {

    private Long id;

    private Long propertyId;
    private String propertyName;

    private Long tenantId;
    private String tenantName;

    private LocalDate startDate;
    private LocalDate endDate;

    private Double monthlyRent;
    private Double securityDeposit;

    private LeaseStatus status;
}
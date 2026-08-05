package com.smartlease.rent.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
public class RentResponse {

    private Long id;

    private Long leaseId;

    private Long propertyId;

    private String propertyName;

    private Long tenantId;

    private String tenantName;

    private Double amount;

    private LocalDate dueDate;

    private LocalDate paidDate;

    private String paymentStatus;
}
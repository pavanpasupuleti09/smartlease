package com.smartlease.rent.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RentRequest {

    private Long leaseId;

    private Double amount;

    private LocalDate dueDate;

    private LocalDate paidDate;

    private String paymentStatus;
}
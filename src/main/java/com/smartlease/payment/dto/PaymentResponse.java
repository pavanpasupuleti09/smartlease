package com.smartlease.payment.dto;

import com.smartlease.payment.enums.PaymentStatus;
import com.smartlease.payment.enums.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class PaymentResponse {

    private Long id;
    private Long leaseId;
    private Long tenantId;
    private String tenantName;
    private Double amount;
    private PaymentType paymentType;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private PaymentStatus status;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}

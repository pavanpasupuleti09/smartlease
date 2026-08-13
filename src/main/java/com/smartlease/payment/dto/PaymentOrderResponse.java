package com.smartlease.payment.dto;

import com.smartlease.payment.enums.PaymentStatus;
import com.smartlease.payment.enums.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PaymentOrderResponse {

    private Long paymentId;
    private String orderId;
    private Double amount;
    private String currency;
    private String keyId;
    private PaymentType paymentType;
    private Long leaseId;
    private PaymentStatus status;
}

package com.smartlease.payment.dto;

import com.smartlease.payment.enums.PaymentType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentOrderRequest {

    private Long leaseId;

    private PaymentType paymentType;
}

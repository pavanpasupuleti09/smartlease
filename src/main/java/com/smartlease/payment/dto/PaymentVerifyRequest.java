package com.smartlease.payment.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentVerifyRequest {

    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}

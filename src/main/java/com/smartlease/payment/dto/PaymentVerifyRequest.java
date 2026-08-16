package com.smartlease.payment.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentVerifyRequest {

    @JsonAlias("razorpay_order_id")
    private String razorpayOrderId;

    @JsonAlias("razorpay_payment_id")
    private String razorpayPaymentId;

    @JsonAlias("razorpay_signature")
    private String razorpaySignature;
}

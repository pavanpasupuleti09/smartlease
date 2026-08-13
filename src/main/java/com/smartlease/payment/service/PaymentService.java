package com.smartlease.payment.service;

import com.smartlease.auth.entity.User;
import com.smartlease.payment.dto.PaymentOrderRequest;
import com.smartlease.payment.dto.PaymentOrderResponse;
import com.smartlease.payment.dto.PaymentResponse;
import com.smartlease.payment.dto.PaymentVerifyRequest;

import java.util.List;

public interface PaymentService {

    PaymentOrderResponse createOrder(User tenant, PaymentOrderRequest request);

    PaymentResponse verifyPayment(User caller, PaymentVerifyRequest request);

    List<PaymentResponse> getPaymentsByLease(Long leaseId, User caller);
}

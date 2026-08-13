package com.smartlease.payment.controller;

import com.smartlease.auth.entity.User;
import com.smartlease.payment.dto.PaymentOrderRequest;
import com.smartlease.payment.dto.PaymentOrderResponse;
import com.smartlease.payment.dto.PaymentResponse;
import com.smartlease.payment.dto.PaymentVerifyRequest;
import com.smartlease.payment.service.PaymentService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/order")
    public PaymentOrderResponse createOrder(@RequestBody PaymentOrderRequest request,
                                            @AuthenticationPrincipal User user) {
        return paymentService.createOrder(user, request);
    }

    @PostMapping("/verify")
    public PaymentResponse verifyPayment(@RequestBody PaymentVerifyRequest request,
                                         @AuthenticationPrincipal User user) {
        return paymentService.verifyPayment(user, request);
    }

    @GetMapping("/lease/{leaseId}")
    public List<PaymentResponse> getPaymentsByLease(@PathVariable Long leaseId,
                                                    @AuthenticationPrincipal User user) {
        return paymentService.getPaymentsByLease(leaseId, user);
    }
}

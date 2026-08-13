package com.smartlease.payment.repository;

import com.smartlease.payment.entity.Payment;
import com.smartlease.payment.enums.PaymentStatus;
import com.smartlease.payment.enums.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);

    boolean existsByLeaseIdAndPaymentTypeAndStatus(Long leaseId, PaymentType paymentType, PaymentStatus status);

    List<Payment> findByLeaseIdOrderByCreatedAtDesc(Long leaseId);
}

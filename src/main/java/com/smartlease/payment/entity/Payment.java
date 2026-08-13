package com.smartlease.payment.entity;

import com.smartlease.auth.entity.User;
import com.smartlease.common.BaseEntity;
import com.smartlease.lease.entity.Lease;
import com.smartlease.payment.enums.PaymentStatus;
import com.smartlease.payment.enums.PaymentType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "payments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payments_razorpay_order_id", columnNames = "razorpay_order_id"),
        @UniqueConstraint(name = "uk_payments_razorpay_payment_id", columnNames = "razorpay_payment_id")
})
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lease_id", nullable = false)
    private Lease lease;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType;

    @Column(name = "razorpay_order_id", nullable = false)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.ORDER_CREATED;

    private LocalDateTime paidAt;
}

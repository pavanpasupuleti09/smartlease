package com.smartlease.payment.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.smartlease.auth.entity.User;
import com.smartlease.auth.enums.Role;
import com.smartlease.lease.entity.Lease;
import com.smartlease.lease.enums.LeaseStatus;
import com.smartlease.lease.repository.LeaseRepository;
import com.smartlease.payment.dto.PaymentOrderRequest;
import com.smartlease.payment.dto.PaymentOrderResponse;
import com.smartlease.payment.dto.PaymentResponse;
import com.smartlease.payment.dto.PaymentVerifyRequest;
import com.smartlease.payment.entity.Payment;
import com.smartlease.payment.enums.PaymentStatus;
import com.smartlease.payment.enums.PaymentType;
import com.smartlease.payment.repository.PaymentRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final LeaseRepository leaseRepository;
    private final String razorpayKeyId;
    private final String razorpayKeySecret;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              LeaseRepository leaseRepository,
                              @Value("${razorpay.key-id:}") String razorpayKeyId,
                              @Value("${razorpay.key-secret:}") String razorpayKeySecret) {
        this.paymentRepository = paymentRepository;
        this.leaseRepository = leaseRepository;
        this.razorpayKeyId = razorpayKeyId;
        this.razorpayKeySecret = razorpayKeySecret;
    }

    @Override
    @Transactional
    public PaymentOrderResponse createOrder(User tenant, PaymentOrderRequest request) {

        if (tenant.getRole() != Role.TENANT) {
            throw new RuntimeException("Only users with TENANT role can create payments");
        }

        Lease lease = leaseRepository.findById(request.getLeaseId())
                .orElseThrow(() -> new RuntimeException("Lease not found"));

        if (lease.getTenant() == null || !lease.getTenant().getEmail().equals(tenant.getEmail())) {
            throw new RuntimeException("Only the tenant of the lease can create a payment");
        }

        if (lease.getStatus() != LeaseStatus.ACTIVE) {
            throw new RuntimeException("Only active leases can be paid");
        }

        PaymentType type = request.getPaymentType();
        if (type == null) {
            throw new RuntimeException("Invalid payment type");
        }

        if (type == PaymentType.SECURITY_DEPOSIT
                && paymentRepository.existsByLeaseIdAndPaymentTypeAndStatus(
                        lease.getId(), PaymentType.SECURITY_DEPOSIT, PaymentStatus.PAID)) {
            throw new RuntimeException("Security deposit payment already exists for this lease");
        }

        double amount = resolveAmount(lease, type);

        if (razorpayKeyId.isBlank() || razorpayKeySecret.isBlank()) {
            throw new RuntimeException("Invalid Razorpay configuration: credentials not set");
        }

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", Math.round(amount * 100));
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "lease_" + lease.getId() + "_" + type.name().toLowerCase());

        JSONObject notes = new JSONObject();
        notes.put("leaseId", lease.getId());
        notes.put("paymentType", type.name());
        orderRequest.put("notes", notes);

        Order order;
        try {
            order = new RazorpayClient(razorpayKeyId, razorpayKeySecret)
                    .orders.create(orderRequest);
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to create Razorpay order");
        }

        Payment payment = new Payment();
        payment.setLease(lease);
        payment.setTenant(tenant);
        payment.setAmount(amount);
        payment.setPaymentType(type);
        payment.setRazorpayOrderId(order.get("id"));
        payment.setStatus(PaymentStatus.ORDER_CREATED);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);

        return new PaymentOrderResponse(
                saved.getId(),
                saved.getRazorpayOrderId(),
                saved.getAmount(),
                "INR",
                razorpayKeyId,
                saved.getPaymentType(),
                lease.getId(),
                saved.getStatus()
        );
    }

    /**
     * The payment amount always comes from trusted lease data, never from the client.
     * For SECURITY_DEPOSIT the lease's deposit is used, falling back to two months'
     * rent when not set (same convention as lease creation). For MONTHLY_RENT the
     * lease's monthly rent is used.
     */
    private double resolveAmount(Lease lease, PaymentType type) {

        if (type == PaymentType.SECURITY_DEPOSIT) {
            Double deposit = lease.getSecurityDeposit() != null
                    ? lease.getSecurityDeposit()
                    : (lease.getMonthlyRent() != null ? lease.getMonthlyRent() * 2 : null);
            if (deposit == null || deposit <= 0) {
                throw new RuntimeException("Invalid lease deposit amount");
            }
            return deposit;
        }

        Double rent = lease.getMonthlyRent();
        if (rent == null || rent <= 0) {
            throw new RuntimeException("Invalid lease rent amount");
        }
        return rent;
    }

    @Override
    @Transactional(noRollbackFor = RuntimeException.class)
    public PaymentResponse verifyPayment(User caller, PaymentVerifyRequest request) {

        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment order not found"));

        if (!payment.getTenant().getId().equals(caller.getId())
                && caller.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only the tenant of the payment can verify it");
        }

        // Idempotency: an already verified payment is returned without re-processing.
        if (payment.getStatus() == PaymentStatus.PAID) {
            return toResponse(payment);
        }

        if (razorpayKeySecret.isBlank()) {
            throw new RuntimeException("Invalid Razorpay configuration: credentials not set");
        }

        String payload = payment.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();

        boolean signatureValid;
        try {
            signatureValid = Utils.verifySignature(
                    payload, request.getRazorpaySignature(), razorpayKeySecret);
        } catch (Exception e) {
            signatureValid = false;
        }

        if (!signatureValid) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            throw new RuntimeException("Invalid payment signature");
        }

        // A Razorpay payment id may only be applied to a single order.
        Optional<Payment> existing = paymentRepository.findByRazorpayPaymentId(request.getRazorpayPaymentId());
        if (existing.isPresent() && !existing.get().getId().equals(payment.getId())) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            throw new RuntimeException("Invalid payment: already processed for another order");
        }

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());

        return toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByLease(Long leaseId, User caller) {

        Lease lease = leaseRepository.findById(leaseId)
                .orElseThrow(() -> new RuntimeException("Lease not found"));

        boolean isLeaseTenant = lease.getTenant() != null
                && lease.getTenant().getEmail().equals(caller.getEmail());

        if (!isLeaseTenant && caller.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only the tenant of the lease can view its payments");
        }

        return paymentRepository.findByLeaseIdOrderByCreatedAtDesc(leaseId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private PaymentResponse toResponse(Payment payment) {

        return new PaymentResponse(
                payment.getId(),
                payment.getLease().getId(),
                payment.getTenant().getId(),
                payment.getTenant().getFullName(),
                payment.getAmount(),
                payment.getPaymentType(),
                payment.getRazorpayOrderId(),
                payment.getRazorpayPaymentId(),
                payment.getStatus(),
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }
}

package com.smartlease.rent.entity;

import com.smartlease.common.BaseEntity;
import com.smartlease.lease.entity.Lease;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "rents")
public class Rent extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "lease_id")
    private Lease lease;

    private Double amount;

    private LocalDate dueDate;

    private LocalDate paidDate;

    private String paymentStatus;
}
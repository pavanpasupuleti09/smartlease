package com.smartlease.lease.entity;

import com.smartlease.common.BaseEntity;
import com.smartlease.property.entity.Property;
import com.smartlease.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "leases")
public class Lease extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "property_id")
    private Property property;

    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    private LocalDate startDate;

    private LocalDate endDate;

    private Double monthlyRent;

    private Double securityDeposit;
}
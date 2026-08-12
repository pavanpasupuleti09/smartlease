package com.smartlease.rentalrequest.entity;

import com.smartlease.auth.entity.User;
import com.smartlease.common.BaseEntity;
import com.smartlease.property.entity.Property;
import com.smartlease.rentalrequest.enums.RentalRequestStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "rental_requests")
public class RentalRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalRequestStatus status = RentalRequestStatus.PENDING;

    private String rejectionReason;
}

package com.smartlease.maintenance.entity;

import com.smartlease.common.BaseEntity;
import com.smartlease.property.entity.Property;
import com.smartlease.tenant.entity.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "maintenance")
public class Maintenance extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "property_id")
    private Property property;

    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    private String issueTitle;

    private String description;

    private String status;
}
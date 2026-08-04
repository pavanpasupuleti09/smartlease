package com.smartlease.tenant.entity;

import com.smartlease.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tenants")
public class Tenant extends BaseEntity {

    private String fullName;

    private String email;

    private String phone;

    private String aadhaarNumber;

}
package com.smartlease.tenant.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TenantRequest {

    private String fullName;
    private String email;
    private String phone;
    private String aadhaarNumber;
}
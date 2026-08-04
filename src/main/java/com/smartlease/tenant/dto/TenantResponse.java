package com.smartlease.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class TenantResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String aadhaarNumber;

}
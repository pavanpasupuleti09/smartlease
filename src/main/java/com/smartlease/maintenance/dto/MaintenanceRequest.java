package com.smartlease.maintenance.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MaintenanceRequest {

    private Long propertyId;
    private Long tenantId;

    private String issueTitle;
    private String description;
    private String status;
}
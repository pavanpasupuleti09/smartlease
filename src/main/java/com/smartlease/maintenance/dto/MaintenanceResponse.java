package com.smartlease.maintenance.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class MaintenanceResponse {

    private Long id;

    private Long propertyId;
    private String propertyName;

    private Long tenantId;
    private String tenantName;

    private String issueTitle;
    private String description;
    private String status;
}
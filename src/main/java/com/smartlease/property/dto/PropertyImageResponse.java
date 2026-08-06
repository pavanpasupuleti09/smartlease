package com.smartlease.property.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PropertyImageResponse {

    private Long id;
    private Long propertyId;
    private String filename;
    private String contentType;
    private Integer fileSize;
    private boolean isPrimary;
    private int sortOrder;
}

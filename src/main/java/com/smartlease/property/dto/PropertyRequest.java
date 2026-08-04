package com.smartlease.property.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PropertyRequest {

    private String propertyName;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private Integer totalUnits;
    private Double monthlyRent;
    private String description;
}
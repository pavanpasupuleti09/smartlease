package com.smartlease.property.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PropertyResponse {

    private Long id;
    private String propertyName;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private Integer totalUnits;
    private Double monthlyRent;
    private String description;
}
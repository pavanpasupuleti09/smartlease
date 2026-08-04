package com.smartlease.property.entity;

import com.smartlease.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "properties")
public class Property extends BaseEntity {

    @Column(nullable = false)
    private String propertyName;

    @Column(nullable = false)
    private String address;

    private String city;

    private String state;

    private String pincode;

    @Column(nullable = false)
    private Integer totalUnits;

    @Column(nullable = false)
    private Double monthlyRent;

    private String description;
}
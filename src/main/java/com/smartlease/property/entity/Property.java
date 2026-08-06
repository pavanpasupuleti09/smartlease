package com.smartlease.property.entity;

import com.smartlease.auth.entity.User;
import com.smartlease.common.BaseEntity;
import com.smartlease.property.enums.Furnishing;
import com.smartlease.property.enums.PropertyType;
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

    @Enumerated(EnumType.STRING)
    private PropertyType propertyType;

    private Integer bedrooms;

    private Integer bathrooms;

    @Enumerated(EnumType.STRING)
    private Furnishing furnishing;

    private Double areaSqft;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;
}
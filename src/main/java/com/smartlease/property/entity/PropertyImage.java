package com.smartlease.property.entity;

import com.smartlease.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "property_images")
public class PropertyImage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String filePath;

    @Column(nullable = false)
    private Integer fileSize;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private boolean isPrimary;

    @Column(nullable = false)
    private int sortOrder;
}

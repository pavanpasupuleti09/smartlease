package com.smartlease.common;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;


import java.time.LocalDateTime;
@MappedSuperclass



public class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private LocalDateTime cretedAt;
    private LocalDateTime updatedAt;

}

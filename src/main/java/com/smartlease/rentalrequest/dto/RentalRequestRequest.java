package com.smartlease.rentalrequest.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RentalRequestRequest {

    private Long userId;

    private Long propertyId;
}

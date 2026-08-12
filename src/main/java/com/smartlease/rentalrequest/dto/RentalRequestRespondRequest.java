package com.smartlease.rentalrequest.dto;

import com.smartlease.rentalrequest.enums.RentalRequestStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RentalRequestRespondRequest {

    private Long ownerId;

    private RentalRequestStatus decision;

    private String rejectionReason;
}

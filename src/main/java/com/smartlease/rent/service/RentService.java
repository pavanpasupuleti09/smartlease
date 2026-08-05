package com.smartlease.rent.service;

import com.smartlease.rent.dto.RentRequest;
import com.smartlease.rent.dto.RentResponse;

import java.util.List;

public interface RentService {

    RentResponse createRent(RentRequest request);

    List<RentResponse> getAllRents();

    RentResponse getRentById(Long id);

    RentResponse updateRent(Long id, RentRequest request);

    void deleteRent(Long id);
}
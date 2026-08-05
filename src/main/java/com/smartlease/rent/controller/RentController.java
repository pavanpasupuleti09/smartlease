package com.smartlease.rent.controller;

import com.smartlease.rent.dto.RentRequest;
import com.smartlease.rent.dto.RentResponse;
import com.smartlease.rent.service.RentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rents")
public class RentController {

    private final RentService rentService;

    public RentController(RentService rentService) {
        this.rentService = rentService;
    }

    @PostMapping
    public RentResponse createRent(@RequestBody RentRequest request) {
        return rentService.createRent(request);
    }

    @GetMapping
    public List<RentResponse> getAllRents() {
        return rentService.getAllRents();
    }

    @GetMapping("/{id}")
    public RentResponse getRentById(@PathVariable Long id) {
        return rentService.getRentById(id);
    }

    @PutMapping("/{id}")
    public RentResponse updateRent(@PathVariable Long id,
                                   @RequestBody RentRequest request) {
        return rentService.updateRent(id, request);
    }

    @DeleteMapping("/{id}")
    public String deleteRent(@PathVariable Long id) {
        rentService.deleteRent(id);
        return "Rent Deleted Successfully";
    }
}
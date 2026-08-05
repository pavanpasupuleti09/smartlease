package com.smartlease.rent.service;

import com.smartlease.lease.entity.Lease;
import com.smartlease.lease.repository.LeaseRepository;
import com.smartlease.rent.dto.RentRequest;
import com.smartlease.rent.dto.RentResponse;
import com.smartlease.rent.entity.Rent;
import com.smartlease.rent.repository.RentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RentServiceImpl implements RentService {

    private final RentRepository rentRepository;
    private final LeaseRepository leaseRepository;

    public RentServiceImpl(RentRepository rentRepository,
                           LeaseRepository leaseRepository) {
        this.rentRepository = rentRepository;
        this.leaseRepository = leaseRepository;
    }

    @Override
    public RentResponse createRent(RentRequest request) {

        Lease lease = leaseRepository.findById(request.getLeaseId())
                .orElseThrow(() -> new RuntimeException("Lease not found"));

        Rent rent = new Rent();

        rent.setLease(lease);
        rent.setAmount(request.getAmount());
        rent.setDueDate(request.getDueDate());
        rent.setPaidDate(request.getPaidDate());
        rent.setPaymentStatus(request.getPaymentStatus());

        Rent savedRent = rentRepository.save(rent);

        return new RentResponse(
                savedRent.getId(),
                lease.getId(),
                lease.getProperty().getId(),
                lease.getProperty().getPropertyName(),
                lease.getTenant().getId(),
                lease.getTenant().getFullName(),
                savedRent.getAmount(),
                savedRent.getDueDate(),
                savedRent.getPaidDate(),
                savedRent.getPaymentStatus()
        );
    }

    @Override
    public List<RentResponse> getAllRents() {

        return rentRepository.findAll()
                .stream()
                .map(rent -> new RentResponse(
                        rent.getId(),
                        rent.getLease().getId(),
                        rent.getLease().getProperty().getId(),
                        rent.getLease().getProperty().getPropertyName(),
                        rent.getLease().getTenant().getId(),
                        rent.getLease().getTenant().getFullName(),
                        rent.getAmount(),
                        rent.getDueDate(),
                        rent.getPaidDate(),
                        rent.getPaymentStatus()
                ))
                .toList();
    }

    @Override
    public RentResponse getRentById(Long id) {

        Rent rent = rentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rent not found"));

        return new RentResponse(
                rent.getId(),
                rent.getLease().getId(),
                rent.getLease().getProperty().getId(),
                rent.getLease().getProperty().getPropertyName(),
                rent.getLease().getTenant().getId(),
                rent.getLease().getTenant().getFullName(),
                rent.getAmount(),
                rent.getDueDate(),
                rent.getPaidDate(),
                rent.getPaymentStatus()
        );
    }

    @Override
    public RentResponse updateRent(Long id, RentRequest request) {

        Rent rent = rentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rent not found"));

        Lease lease = leaseRepository.findById(request.getLeaseId())
                .orElseThrow(() -> new RuntimeException("Lease not found"));

        rent.setLease(lease);
        rent.setAmount(request.getAmount());
        rent.setDueDate(request.getDueDate());
        rent.setPaidDate(request.getPaidDate());
        rent.setPaymentStatus(request.getPaymentStatus());

        Rent updatedRent = rentRepository.save(rent);

        return new RentResponse(
                updatedRent.getId(),
                lease.getId(),
                lease.getProperty().getId(),
                lease.getProperty().getPropertyName(),
                lease.getTenant().getId(),
                lease.getTenant().getFullName(),
                updatedRent.getAmount(),
                updatedRent.getDueDate(),
                updatedRent.getPaidDate(),
                updatedRent.getPaymentStatus()
        );
    }

    @Override
    public void deleteRent(Long id) {

        Rent rent = rentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rent not found"));

        rentRepository.delete(rent);
    }
}
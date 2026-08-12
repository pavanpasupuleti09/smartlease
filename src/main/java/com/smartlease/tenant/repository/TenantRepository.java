package com.smartlease.tenant.repository;

import com.smartlease.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByEmail(String email);
}
package com.smartlease.auth.service;

import com.smartlease.auth.dto.AuthResponse;
import com.smartlease.auth.dto.LoginRequest;
import com.smartlease.auth.dto.RegistrationRequest;

public interface UserService {

    void registerUser(RegistrationRequest request);

    AuthResponse login(LoginRequest request);

}
package com.smartlease.auth.controller;

import com.smartlease.auth.dto.RegistrationRequest;
import com.smartlease.auth.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public String registerUser(@RequestBody RegistrationRequest request) {

        userService.registerUser(request);

        return "User Registered Successfully";
    }
}
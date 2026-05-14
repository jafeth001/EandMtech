package com.taskmanagement.technicalinterview.controller;

import com.taskmanagement.technicalinterview.dto.AuthResponse;
import com.taskmanagement.technicalinterview.dto.CreateUserRequest;
import com.taskmanagement.technicalinterview.dto.LoginRequest;
import com.taskmanagement.technicalinterview.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication Management APIs")
public class AuthController {

    private final AuthService authService;

    @Operation(
            summary = "Register User",
            description = "Creates a new supervisor or employee account"
    )
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody CreateUserRequest request) {

        authService.register(request);

        return ResponseEntity.ok("User registered successfully");
    }

    @Operation(
            summary = "Login User",
            description = "Authenticates a user and returns JWT token"
    )
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }
}
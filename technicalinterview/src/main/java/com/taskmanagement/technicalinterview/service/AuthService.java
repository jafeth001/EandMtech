package com.taskmanagement.technicalinterview.service;

import com.taskmanagement.technicalinterview.config.security.JwtService;
import com.taskmanagement.technicalinterview.dto.AuthResponse;
import com.taskmanagement.technicalinterview.dto.CreateUserRequest;
import com.taskmanagement.technicalinterview.dto.LoginRequest;
import com.taskmanagement.technicalinterview.dto.TaskRequest;
import com.taskmanagement.technicalinterview.models.User;
import com.taskmanagement.technicalinterview.repository.UserRepository;
import com.taskmanagement.technicalinterview.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final TaskService taskService;

    public void register(CreateUserRequest request) {

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

        String token = jwtService.generateToken(request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found after login"));

        return new AuthResponse(token, user.getEmail(), user.getFullName(), user.getRole().name());
    }
}
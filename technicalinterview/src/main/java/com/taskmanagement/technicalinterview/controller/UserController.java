package com.taskmanagement.technicalinterview.controller;

import com.taskmanagement.technicalinterview.enums.Role;
import com.taskmanagement.technicalinterview.models.User;
import com.taskmanagement.technicalinterview.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User listing APIs")
public class UserController {

    private final UserRepository userRepository;

    @Operation(summary = "Get all employees", description = "Supervisor lists all employees for task assignment")
    @GetMapping("/employees")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<List<User>> getEmployees() {
        return ResponseEntity.ok(userRepository.findByRole(Role.EMPLOYEE));
    }
}

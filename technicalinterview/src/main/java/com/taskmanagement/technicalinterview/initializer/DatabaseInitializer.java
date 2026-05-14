package com.taskmanagement.technicalinterview.initializer;

import com.taskmanagement.technicalinterview.models.User;
import com.taskmanagement.technicalinterview.repository.UserRepository;
import com.taskmanagement.technicalinterview.enums.Role;
import com.taskmanagement.technicalinterview.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DatabaseInitializer implements CommandLineRunner {
    
    private static final String DEFAULT_SUPERVISOR_EMAIL = "supervisor@example.com";
    private static final String DEFAULT_SUPERVISOR_PASSWORD = "supervisor123";
    private static final String DEFAULT_EMPLOYEE_EMAIL = "employee@example.com";
    private static final String DEFAULT_EMPLOYEE_PASSWORD = "employee123";
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private UserService userService;
    
    @Override
    public void run(String... args) throws Exception {
        createSupervisorUserIfNotExists();
        createEmployeeUserIfNotExists();
    }
    
    private void createSupervisorUserIfNotExists() {
        if (!userService.doesUserExist(DEFAULT_SUPERVISOR_EMAIL)) {
            User supervisorUser = User.builder()
                .fullName("Supervisor User")
                .email(DEFAULT_SUPERVISOR_EMAIL)
                .password(passwordEncoder.encode(DEFAULT_SUPERVISOR_PASSWORD))
                .role(Role.SUPERVISOR)
                .build();
            
            userRepository.save(supervisorUser);
        }
    }
    
    private void createEmployeeUserIfNotExists() {
        if (!userService.doesUserExist(DEFAULT_EMPLOYEE_EMAIL)) {
            User employeeUser = User.builder()
                .fullName("Employee User")
                .email(DEFAULT_EMPLOYEE_EMAIL)
                .password(passwordEncoder.encode(DEFAULT_EMPLOYEE_PASSWORD))
                .role(Role.EMPLOYEE)
                .build();
            
            userRepository.save(employeeUser);
        }
    }
}
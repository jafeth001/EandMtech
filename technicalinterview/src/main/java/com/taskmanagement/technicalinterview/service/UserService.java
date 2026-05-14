package com.taskmanagement.technicalinterview.service;

import com.taskmanagement.technicalinterview.models.User;
import com.taskmanagement.technicalinterview.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Checks if a user with the specified email exists in the database
     * @param email The email address to check
     * @return true if user exists, false otherwise
     */
    public boolean doesUserExist(String email) {
        return userRepository.findByEmail(email).isPresent();
    }
    
    /**
     * Retrieves a user by their email address
     * @param email The email address to search for
     * @return The user if found, null otherwise
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }
}
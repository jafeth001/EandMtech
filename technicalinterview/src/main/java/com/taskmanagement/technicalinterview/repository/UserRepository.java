package com.taskmanagement.technicalinterview.repository;

import com.taskmanagement.technicalinterview.enums.Role;
import com.taskmanagement.technicalinterview.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);
}

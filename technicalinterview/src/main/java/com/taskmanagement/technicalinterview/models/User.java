package com.taskmanagement.technicalinterview.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.taskmanagement.technicalinterview.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @Column(unique = true)
    private String email;

    @JsonIgnore  // never expose hashed password over API
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;
}

package com.taskmanagement.technicalinterview.dto;

import com.taskmanagement.technicalinterview.enums.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequest {

    private String fullName;
    private String email;
    private String password;
    private Role role;
}

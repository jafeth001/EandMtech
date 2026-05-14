package com.taskmanagement.technicalinterview.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.taskmanagement.technicalinterview.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    // TEMPORARILY REMOVE RELATIONSHIPS
    private Long createdById;

    private Long assignedToId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
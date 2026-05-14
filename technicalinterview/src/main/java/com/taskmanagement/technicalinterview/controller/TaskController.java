package com.taskmanagement.technicalinterview.controller;

import com.taskmanagement.technicalinterview.dto.TaskRequest;
import com.taskmanagement.technicalinterview.enums.TaskStatus;
import com.taskmanagement.technicalinterview.models.Task;
import com.taskmanagement.technicalinterview.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Task Management", description = "Task Management APIs")
public class TaskController {

    private final TaskService taskService;

    @Operation(
            summary = "Create Task",
            description = "Supervisor creates a new task"
    )
    @PostMapping
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<Task> createTask(
            @RequestBody TaskRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                taskService.createTask(request));
    }

    @Operation(
            summary = "Assign Task",
            description = "Supervisor assigns task to employee"
    )
    @PutMapping("/{taskId}/assign/{employeeId}")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<Task> assignTask(
            @PathVariable Long taskId,
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                taskService.assignTask(taskId, employeeId));
    }

    @Operation(
            summary = "Update Task Status",
            description = "Employee or supervisor updates task workflow status"
    )
    @PutMapping("/{taskId}/status")
    public ResponseEntity<Task> updateStatus(
            @PathVariable Long taskId,
            @RequestParam TaskStatus status,
            Authentication authentication) {

        return ResponseEntity.ok(
                taskService.updateStatus(
                        taskId,
                        status,
                        authentication.getName()));
    }

    @Operation(
            summary = "Get All Tasks",
            description = "Returns all tasks in the system"
    )
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {

        return ResponseEntity.ok(taskService.getAllTasks());
    }
}

package com.taskmanagement.technicalinterview.service;

import com.taskmanagement.technicalinterview.dto.TaskRequest;
import com.taskmanagement.technicalinterview.enums.TaskStatus;
import com.taskmanagement.technicalinterview.models.Task;
import com.taskmanagement.technicalinterview.models.TaskHistory;
import com.taskmanagement.technicalinterview.repository.TaskHistoryRepository;
import com.taskmanagement.technicalinterview.repository.TaskRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskHistoryRepository historyRepository;

    /**
     * CREATE TASK
     */
    public Task createTask(TaskRequest request) {

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TaskStatus.CREATED)
                .createdById(1L) // temporary hardcoded supervisor
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return taskRepository.save(task);
    }

    /**
     * ASSIGN TASK TO EMPLOYEE
     */
    public Task assignTask(Long taskId, Long employeeId) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Task not found"));

        task.setAssignedToId(employeeId);
        task.setStatus(TaskStatus.ASSIGNED);
        task.setUpdatedAt(LocalDateTime.now());

        return taskRepository.save(task);
    }

    /**
     * UPDATE TASK STATUS
     */
    public Task updateStatus(Long taskId,
                             TaskStatus newStatus,
                             String updatedBy) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Task not found"));

        validateFlow(task.getStatus(), newStatus);

        TaskStatus oldStatus = task.getStatus();

        task.setStatus(newStatus);
        task.setUpdatedAt(LocalDateTime.now());

        Task savedTask = taskRepository.save(task);

        // SAVE TASK HISTORY
        TaskHistory history = TaskHistory.builder()
                .task(savedTask)
                .previousStatus(oldStatus)
                .newStatus(newStatus)
                .updatedBy(updatedBy)
                .timestamp(LocalDateTime.now())
                .build();

        historyRepository.save(history);

        return savedTask;
    }

    /**
     * GET ALL TASKS
     */
    public List<Task> getAllTasks() {

        return taskRepository.findAll();
    }

    /**
     * GET EMPLOYEE TASKS
     */
    public List<Task> getEmployeeTasks(Long employeeId) {

        return taskRepository.findByAssignedToId(employeeId);
    }

    /**
     * VALIDATE TASK FLOW
     */
    private void validateFlow(TaskStatus current,
                              TaskStatus next) {

        // CREATED -> ASSIGNED
        if (current == TaskStatus.CREATED
                && next != TaskStatus.ASSIGNED) {

            throw new RuntimeException(
                    "Invalid transition from CREATED");
        }

        // ASSIGNED -> IN_PROGRESS
        if (current == TaskStatus.ASSIGNED
                && next != TaskStatus.IN_PROGRESS) {

            throw new RuntimeException(
                    "Invalid transition from ASSIGNED");
        }

        // IN_PROGRESS -> RESOLVED
        if (current == TaskStatus.IN_PROGRESS
                && next != TaskStatus.RESOLVED) {

            throw new RuntimeException(
                    "Invalid transition from IN_PROGRESS");
        }

        // RESOLVED -> DONE
        if (current == TaskStatus.RESOLVED
                && next != TaskStatus.DONE) {

            throw new RuntimeException(
                    "Invalid transition from RESOLVED");
        }
    }
}
package com.taskmanagement.technicalinterview.service;


import com.taskmanagement.technicalinterview.dto.TaskRequest;
import com.taskmanagement.technicalinterview.enums.TaskStatus;
import com.taskmanagement.technicalinterview.models.Task;
import com.taskmanagement.technicalinterview.models.TaskHistory;
import com.taskmanagement.technicalinterview.models.User;
import com.taskmanagement.technicalinterview.repository.TaskHistoryRepository;
import com.taskmanagement.technicalinterview.repository.TaskRepository;
import com.taskmanagement.technicalinterview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskHistoryRepository historyRepository;

    public Task createTask(TaskRequest request, String creatorEmail) {

        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow();

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TaskStatus.CREATED)
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .build();

        return taskRepository.save(task);
    }

    public Task assignTask(Long taskId, Long employeeId) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow();

        User employee = userRepository.findById(employeeId)
                .orElseThrow();

        task.setAssignedTo(employee);
        task.setStatus(TaskStatus.ASSIGNED);

        return taskRepository.save(task);
    }

    public Task updateStatus(Long taskId,
                             TaskStatus newStatus,
                             String updatedBy) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        validateFlow(task.getStatus(), newStatus);

        TaskStatus oldStatus = task.getStatus();

        task.setStatus(newStatus);
        task.setUpdatedAt(LocalDateTime.now());

        Task savedTask = taskRepository.save(task);

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

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    private void validateFlow(TaskStatus current, TaskStatus next) {

        if (current == TaskStatus.CREATED && next != TaskStatus.ASSIGNED)
            throw new RuntimeException("Invalid transition");

        if (current == TaskStatus.ASSIGNED && next != TaskStatus.IN_PROGRESS)
            throw new RuntimeException("Invalid transition");

        if (current == TaskStatus.IN_PROGRESS && next != TaskStatus.RESOLVED)
            throw new RuntimeException("Invalid transition");

        if (current == TaskStatus.RESOLVED && next != TaskStatus.DONE)
            throw new RuntimeException("Invalid transition");
    }

}
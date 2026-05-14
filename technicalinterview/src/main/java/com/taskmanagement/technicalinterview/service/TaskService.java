package com.taskmanagement.technicalinterview.service;

import com.taskmanagement.technicalinterview.dto.TaskRequest;
import com.taskmanagement.technicalinterview.enums.TaskStatus;
import com.taskmanagement.technicalinterview.models.Task;
import com.taskmanagement.technicalinterview.models.TaskHistory;
import com.taskmanagement.technicalinterview.models.User;
import com.taskmanagement.technicalinterview.repository.TaskHistoryRepository;
import com.taskmanagement.technicalinterview.repository.TaskRepository;
import com.taskmanagement.technicalinterview.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final TaskHistoryRepository historyRepository;

    /**
     * Create Task
     */
    public Task createTask(TaskRequest request, String creatorEmail) {

        // Get creator by email
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() ->
                        new IllegalArgumentException("Creator user not found"));

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TaskStatus.CREATED)
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return taskRepository.save(task);
    }

    /**
     * Assign Task To Employee
     */
    public Task assignTask(Long taskId, Long employeeId) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Task not found"));

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() ->
                        new RuntimeException("Employee not found"));

        task.setAssignedTo(employee);
        task.setStatus(TaskStatus.ASSIGNED);
        task.setUpdatedAt(LocalDateTime.now());

        return taskRepository.save(task);
    }

    /**
     * Update Task Status
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
     * Get All Tasks
     */
    public List<Task> getAllTasks() {
        List<Task> tasks = taskRepository.findAll();
        System.out.println("Found " + tasks.size() + " tasks in repository");
        return tasks;
    }

    /**
     * Get Tasks Assigned To Employee
     */
    public List<Task> getEmployeeTasks(Long employeeId) {

        return taskRepository.findByAssignedToId(employeeId);
    }

    /**
     * Validate Workflow Transitions
     */
    private void validateFlow(TaskStatus current,
                              TaskStatus next) {

        if (current == TaskStatus.CREATED
                && next != TaskStatus.ASSIGNED) {

            throw new RuntimeException(
                    "Invalid transition from CREATED");
        }

        if (current == TaskStatus.ASSIGNED
                && next != TaskStatus.IN_PROGRESS) {

            throw new RuntimeException(
                    "Invalid transition from ASSIGNED");
        }

        if (current == TaskStatus.IN_PROGRESS
                && next != TaskStatus.RESOLVED) {

            throw new RuntimeException(
                    "Invalid transition from IN_PROGRESS");
        }

        if (current == TaskStatus.RESOLVED
                && next != TaskStatus.DONE) {

            throw new RuntimeException(
                    "Invalid transition from RESOLVED");
        }
    }
}
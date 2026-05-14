package com.taskmanagement.technicalinterview.service;

import com.taskmanagement.technicalinterview.dto.TaskRequest;
import com.taskmanagement.technicalinterview.enums.Role;
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
                .orElseThrow(() -> new RuntimeException("Creator not found"));

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
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new RuntimeException("User is not an employee");
        }

        TaskStatus oldStatus = task.getStatus();
        task.setAssignedTo(employee);
        task.setStatus(TaskStatus.ASSIGNED);
        task.setUpdatedAt(LocalDateTime.now());

        Task saved = taskRepository.save(task);
        saveHistory(saved, oldStatus, TaskStatus.ASSIGNED, employee.getEmail());
        return saved;
    }

    public Task updateStatus(Long taskId, TaskStatus newStatus, String updatedByEmail) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        validateFlow(task.getStatus(), newStatus);

        TaskStatus oldStatus = task.getStatus();
        task.setStatus(newStatus);
        task.setUpdatedAt(LocalDateTime.now());

        Task saved = taskRepository.save(task);
        saveHistory(saved, oldStatus, newStatus, updatedByEmail);
        return saved;
    }

    public List<Task> getTasksForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.SUPERVISOR) {
            return taskRepository.findAll();
        } else {
            return taskRepository.findByAssignedToId(user.getId());
        }
    }

    public Task getTaskById(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
    }

    private void saveHistory(Task task, TaskStatus from, TaskStatus to, String by) {
        historyRepository.save(TaskHistory.builder()
                .task(task)
                .previousStatus(from)
                .newStatus(to)
                .updatedBy(by)
                .timestamp(LocalDateTime.now())
                .build());
    }

    private void validateFlow(TaskStatus current, TaskStatus next) {
        boolean valid = switch (current) {
            case CREATED    -> next == TaskStatus.ASSIGNED;
            case ASSIGNED   -> next == TaskStatus.IN_PROGRESS;
            case IN_PROGRESS-> next == TaskStatus.RESOLVED;
            case RESOLVED   -> next == TaskStatus.DONE;
            case DONE       -> false;
        };
        if (!valid) {
            throw new RuntimeException(
                    "Invalid transition: " + current + " → " + next);
        }
    }
}

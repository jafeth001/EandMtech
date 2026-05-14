package com.taskmanagement.technicalinterview;

import com.taskmanagement.technicalinterview.enums.Role;
import com.taskmanagement.technicalinterview.enums.TaskStatus;
import com.taskmanagement.technicalinterview.models.Task;
import com.taskmanagement.technicalinterview.models.TaskHistory;
import com.taskmanagement.technicalinterview.models.User;
import com.taskmanagement.technicalinterview.repository.TaskHistoryRepository;
import com.taskmanagement.technicalinterview.repository.TaskRepository;
import com.taskmanagement.technicalinterview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        // Only seed if the DB is empty
        if (userRepository.count() > 0) {
            log.info("Database already seeded — skipping.");
            return;
        }

        log.info("Seeding demo data...");

        // ── Supervisor ────────────────────────────────────────────────────────
        User supervisor = userRepository.save(User.builder()
                .fullName("Boris Mwangi")
                .email("boris@taskflow.com")
                .password(passwordEncoder.encode("supervisor123"))
                .role(Role.SUPERVISOR)
                .build());

        // ── Employee ──────────────────────────────────────────────────────────
        User employee = userRepository.save(User.builder()
                .fullName("Alice Kamau")
                .email("alice@taskflow.com")
                .password(passwordEncoder.encode("employee123"))
                .role(Role.EMPLOYEE)
                .build());

        // ── Demo Tasks ────────────────────────────────────────────────────────
        Task task1 = taskRepository.save(Task.builder()
                .title("Prepare Q3 Operations Report")
                .description("Compile all operational metrics for Q3 and present a summary to the management team by end of week.")
                .status(TaskStatus.IN_PROGRESS)
                .createdBy(supervisor)
                .assignedTo(employee)
                .createdAt(LocalDateTime.now().minusDays(3))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());

        taskHistoryRepository.save(TaskHistory.builder()
                .task(task1).previousStatus(TaskStatus.CREATED)
                .newStatus(TaskStatus.ASSIGNED).updatedBy(supervisor.getEmail())
                .timestamp(LocalDateTime.now().minusDays(3)).build());

        taskHistoryRepository.save(TaskHistory.builder()
                .task(task1).previousStatus(TaskStatus.ASSIGNED)
                .newStatus(TaskStatus.IN_PROGRESS).updatedBy(employee.getEmail())
                .timestamp(LocalDateTime.now().minusDays(1)).build());

        Task task2 = taskRepository.save(Task.builder()
                .title("Update Employee Onboarding Checklist")
                .description("Review the current onboarding checklist and update it to reflect the new HR policy changes effective this quarter.")
                .status(TaskStatus.ASSIGNED)
                .createdBy(supervisor)
                .assignedTo(employee)
                .createdAt(LocalDateTime.now().minusDays(1))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());

        taskHistoryRepository.save(TaskHistory.builder()
                .task(task2).previousStatus(TaskStatus.CREATED)
                .newStatus(TaskStatus.ASSIGNED).updatedBy(supervisor.getEmail())
                .timestamp(LocalDateTime.now().minusDays(1)).build());

        Task task3 = taskRepository.save(Task.builder()
                .title("Audit Vendor Contracts")
                .description("Review all active vendor contracts and flag any that are due for renewal in the next 60 days.")
                .status(TaskStatus.CREATED)
                .createdBy(supervisor)
                .createdAt(LocalDateTime.now())
                .build());

        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("  Demo accounts ready:");
        log.info("  Supervisor → boris@taskflow.com  / supervisor123");
        log.info("  Employee   → alice@taskflow.com  / employee123");
        log.info("  {} demo task(s) created.", taskRepository.count());
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
}

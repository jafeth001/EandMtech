package com.taskmanagement.technicalinterview.repository;

import com.taskmanagement.technicalinterview.models.TaskHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskHistoryRepository  extends JpaRepository<TaskHistory, Long> {
    TaskHistory findByTaskId(Long taskId);
}

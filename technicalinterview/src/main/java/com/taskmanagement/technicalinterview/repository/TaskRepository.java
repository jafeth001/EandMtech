package com.taskmanagement.technicalinterview.repository;

import com.taskmanagement.technicalinterview.models.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedToId(Long employeeId);
}

package com.taskmanagement.technicalinterview.repository;

import com.taskmanagement.technicalinterview.models.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
}
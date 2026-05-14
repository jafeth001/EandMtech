package com.fintech.TaskManagement.controller;

import com.fintech.TaskManagement.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Upload", description = "Task File Upload APIs")
public class FileController {

    private final FileService fileService;

    @Operation(
            summary = "Upload File",
            description = "Uploads supporting task documents"
    )
    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam MultipartFile file)
            throws IOException {

        String path = fileService.uploadFile(file);

        return ResponseEntity.ok(path);
    }
}

package com.fintech.TaskManagement.service;

import lombok.SneakyThrows;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileService {

    private final String uploadDir = "uploads/";

    @SneakyThrows
    public String uploadFile(MultipartFile file) {

        File directory = new File(uploadDir);

        if (!directory.exists()) {
            directory.mkdirs();
        }

        String filePath = uploadDir + file.getOriginalFilename();

        Files.copy(file.getInputStream(),
                Paths.get(filePath),
                StandardCopyOption.REPLACE_EXISTING);

        return filePath;
    }
}

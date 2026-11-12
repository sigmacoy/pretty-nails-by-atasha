package com.prettynails.service;

import com.prettynails.dto.UploadDtos.UploadResponse;
import com.prettynails.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "jpg",
            "jpeg",
            "png",
            "webp"
    );

    private final Path rootLocation;
    private final String baseUrl;

    public FileStorageService(
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.upload.base-url:}") String baseUrl
    ) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.baseUrl = baseUrl;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
            log.info("Upload directory initialized at: {}", rootLocation);
        } catch (IOException e) {
            log.error("Could not initialize upload storage location", e);
            throw new RuntimeException("Could not initialize upload storage location", e);
        }
    }

    public UploadResponse storeFile(MultipartFile file) {
        validateFile(file);

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload"
        );
        String extension = getExtension(originalFilename);

        String storedFilename = UUID.randomUUID() + "." + extension;
        Path destinationFile = this.rootLocation.resolve(storedFilename).normalize().toAbsolutePath();

        if (!destinationFile.getParent().equals(this.rootLocation)) {
            throw new BadRequestException("Cannot store file outside target upload directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("File successfully stored: {} (original: {}, size: {} bytes)",
                    storedFilename, originalFilename, file.getSize());
        } catch (IOException e) {
            log.error("Failed to store file: {}", originalFilename, e);
            throw new BadRequestException("Failed to store file: " + e.getMessage());
        }

        String fileUrl = buildFileUrl(storedFilename);

        return UploadResponse.builder()
                .url(fileUrl)
                .filename(storedFilename)
                .size(file.getSize())
                .build();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size (" + (file.getSize() / 1024 / 1024) + "MB) exceeds maximum allowed size of 5MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Invalid file type [" + contentType + "]. Only JPEG, PNG, and WebP images are allowed.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new BadRequestException("File name cannot be empty.");
        }

        String extension = getExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Invalid file extension [." + extension + "]. Only .jpg, .jpeg, .png, and .webp are allowed.");
        }
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex == -1 || dotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private String buildFileUrl(String filename) {
        if (baseUrl != null && !baseUrl.trim().isEmpty()) {
            String cleanBase = baseUrl.trim().replaceAll("/+$", "");
            return cleanBase + "/uploads/" + filename;
        }

        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(filename)
                    .toUriString();
        } catch (Exception e) {
            return "/uploads/" + filename;
        }
    }

    public Path getRootLocation() {
        return rootLocation;
    }
}

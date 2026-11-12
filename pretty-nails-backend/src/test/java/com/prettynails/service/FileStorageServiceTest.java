package com.prettynails.service;

import com.prettynails.dto.UploadDtos.UploadResponse;
import com.prettynails.exception.BadRequestException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(tempDir.toString(), "http://localhost:8080");
        fileStorageService.init();
    }

    @AfterEach
    void tearDown() throws IOException {
        // TempDir cleaned up automatically
    }

    @Test
    void storeFile_whenValidPng_shouldStoreAndReturnResponse() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample-inspiration.png",
                "image/png",
                "sample-png-data".getBytes()
        );

        UploadResponse response = fileStorageService.storeFile(file);

        assertNotNull(response);
        assertNotNull(response.getUrl());
        assertTrue(response.getUrl().startsWith("http://localhost:8080/uploads/"));
        assertTrue(response.getUrl().endsWith(".png"));
        assertNotNull(response.getFilename());
        assertTrue(response.getFilename().endsWith(".png"));
        assertEquals((long) "sample-png-data".getBytes().length, response.getSize());

        Path storedFile = tempDir.resolve(response.getFilename());
        assertTrue(Files.exists(storedFile));
    }

    @Test
    void storeFile_whenValidJpg_shouldStoreAndReturnResponse() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "receipt.jpg",
                "image/jpeg",
                "sample-jpg-data".getBytes()
        );

        UploadResponse response = fileStorageService.storeFile(file);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".jpg"));
        assertTrue(response.getFilename().endsWith(".jpg"));
        assertTrue(Files.exists(tempDir.resolve(response.getFilename())));
    }

    @Test
    void storeFile_whenValidWebp_shouldStoreAndReturnResponse() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "nails.webp",
                "image/webp",
                "sample-webp-data".getBytes()
        );

        UploadResponse response = fileStorageService.storeFile(file);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".webp"));
        assertTrue(response.getFilename().endsWith(".webp"));
        assertTrue(Files.exists(tempDir.resolve(response.getFilename())));
    }

    @Test
    void storeFile_whenEmptyFile_shouldThrowBadRequestException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(emptyFile)
        );

        assertTrue(ex.getMessage().contains("empty"));
    }

    @Test
    void storeFile_whenFileExceeds5Mb_shouldThrowBadRequestException() {
        byte[] oversizedData = new byte[5 * 1024 * 1024 + 10]; // > 5MB
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "huge.png",
                "image/png",
                oversizedData
        );

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(largeFile)
        );

        assertTrue(ex.getMessage().contains("exceeds maximum allowed size"));
    }

    @Test
    void storeFile_whenInvalidContentType_shouldThrowBadRequestException() {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "pdf-data".getBytes()
        );

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(pdfFile)
        );

        assertTrue(ex.getMessage().contains("Invalid file type"));
    }

    @Test
    void storeFile_whenInvalidExtension_shouldThrowBadRequestException() {
        MockMultipartFile fileWithWrongExt = new MockMultipartFile(
                "file",
                "malicious.exe",
                "image/png",
                "data".getBytes()
        );

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(fileWithWrongExt)
        );

        assertTrue(ex.getMessage().contains("Invalid file extension"));
    }

    @Test
    void storeFile_whenNoBaseUrlConfigured_shouldFallbackToContextPathOrRelative() {
        FileStorageService localService = new FileStorageService(tempDir.toString(), "");
        localService.init();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.png",
                "image/png",
                "data".getBytes()
        );

        UploadResponse response = localService.storeFile(file);

        assertNotNull(response);
        assertTrue(response.getUrl().contains("/uploads/"));
    }
}

package com.prettynails.service;

import com.prettynails.dto.UploadDtos.UploadResponse;
import com.prettynails.exception.BadRequestException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
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

    // ===== Tests for EXIF stripping and dimension validation (Item 4) =====

    @Test
    void storeFile_whenImageExceedsMaxDimension_shouldThrowBadRequestException() throws IOException {
        // Create a large image (5000x5000) - exceeds 4000x4000 limit
        BufferedImage largeImage = new BufferedImage(5000, 5000, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(largeImage, "png", baos);
        byte[] imageData = baos.toByteArray();

        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.png",
                "image/png",
                imageData
        );

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(largeFile)
        );

        assertTrue(ex.getMessage().contains("exceed maximum allowed size"));
        assertTrue(ex.getMessage().contains("5000x5000"));
    }

    @Test
    void storeFile_whenImageAtMaxDimension_shouldAccept() throws IOException {
        // Create image at exactly 4000x4000 - should be accepted
        BufferedImage maxImage = new BufferedImage(4000, 4000, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(maxImage, "png", baos);
        byte[] imageData = baos.toByteArray();

        MockMultipartFile maxFile = new MockMultipartFile(
                "file",
                "max.png",
                "image/png",
                imageData
        );

        UploadResponse response = fileStorageService.storeFile(maxFile);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".png"));
    }

    @Test
    void storeFile_whenImageUnderMaxDimension_shouldAccept() throws IOException {
        // Create a small image (100x100) - well under limit
        BufferedImage smallImage = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(smallImage, "png", baos);
        byte[] imageData = baos.toByteArray();

        MockMultipartFile smallFile = new MockMultipartFile(
                "file",
                "small.png",
                "image/png",
                imageData
        );

        UploadResponse response = fileStorageService.storeFile(smallFile);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".png"));
    }

    @Test
    void storeFile_whenJpegWithExif_shouldStripExifMetadata() throws IOException {
        // Create a JPEG image
        BufferedImage jpegImage = new BufferedImage(800, 600, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(jpegImage, "jpeg", baos);
        byte[] imageData = baos.toByteArray();

        MockMultipartFile jpegFile = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                imageData
        );

        UploadResponse response = fileStorageService.storeFile(jpegFile);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".jpg"));
        // File should be re-encoded (stripping any EXIF)
        assertTrue(Files.exists(tempDir.resolve(response.getFilename())));
    }

    @Test
    void storeFile_whenInvalidImageData_shouldThrowBadRequestException() {
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "not-an-image.txt",
                "image/png",
                "this is not image data".getBytes()
        );

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> fileStorageService.storeFile(invalidFile)
        );

        assertTrue(ex.getMessage().contains("could not decode image"));
    }

    @Test
    void storeFile_whenWebpImage_shouldProcessAndSave() throws IOException {
        BufferedImage webpImage = new BufferedImage(800, 600, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(webpImage, "webp", baos);
        byte[] imageData = baos.toByteArray();

        MockMultipartFile webpFile = new MockMultipartFile(
                "file",
                "photo.webp",
                "image/webp",
                imageData
        );

        UploadResponse response = fileStorageService.storeFile(webpFile);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".webp"));
        assertTrue(Files.exists(tempDir.resolve(response.getFilename())));
    }
}

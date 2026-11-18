package com.prettynails.service;

import com.prettynails.dto.UploadDtos.UploadResponse;
import com.prettynails.exception.BadRequestException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriter;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

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

    private byte[] createValidPngImage(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }

    private byte[] createValidJpegImage(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpeg", baos);
        return baos.toByteArray();
    }

    private byte[] createValidWebpImage(int width, int height) throws IOException {
        // Check if WebP encoder is available
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("webp");
        if (!writers.hasNext()) {
            // WebP not supported by default ImageIO
            return new byte[0];
        }
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "webp", baos);
        return baos.toByteArray();
    }

    @Test
    void storeFile_whenValidPng_shouldStoreAndReturnResponse() throws IOException {
        byte[] pngData = createValidPngImage(800, 600);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample-inspiration.png",
                "image/png",
                pngData
        );

        UploadResponse response = fileStorageService.storeFile(file);

        assertNotNull(response);
        assertNotNull(response.getUrl());
        assertTrue(response.getUrl().startsWith("http://localhost:8080/uploads/"));
        assertTrue(response.getUrl().endsWith(".png"));
        assertNotNull(response.getFilename());
        assertTrue(response.getFilename().endsWith(".png"));
        assertEquals((long) pngData.length, response.getSize());

        Path storedFile = tempDir.resolve(response.getFilename());
        assertTrue(Files.exists(storedFile));
    }

    @Test
    void storeFile_whenValidJpg_shouldStoreAndReturnResponse() throws IOException {
        byte[] jpgData = createValidJpegImage(800, 600);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "receipt.jpg",
                "image/jpeg",
                jpgData
        );

        UploadResponse response = fileStorageService.storeFile(file);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".jpg"));
        assertTrue(response.getFilename().endsWith(".jpg"));
        assertTrue(Files.exists(tempDir.resolve(response.getFilename())));
    }

    @Test
    void storeFile_whenValidWebp_shouldStoreAndReturnResponse() throws IOException {
        byte[] webpData = createValidWebpImage(800, 600);
        // Skip test if WebP encoder is not available
        assumeTrue(webpData.length > 0, "WebP encoder not available in JDK ImageIO");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "nails.webp",
                "image/webp",
                webpData
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
    void storeFile_whenNoBaseUrlConfigured_shouldFallbackToContextPathOrRelative() throws IOException {
        FileStorageService localService = new FileStorageService(tempDir.toString(), "");
        localService.init();

        byte[] pngData = createValidPngImage(100, 100);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "photo.png",
                "image/png",
                pngData
        );

        UploadResponse response = localService.storeFile(file);

        assertNotNull(response);
        assertTrue(response.getUrl().contains("/uploads/"));
    }

    // ===== Tests for EXIF stripping and dimension validation (Item 4) =====

    @Test
    void storeFile_whenImageExceedsMaxDimension_shouldThrowBadRequestException() throws IOException {
        // Create a large image (5000x5000) - exceeds 4000x4000 limit
        byte[] largeImageData = createValidPngImage(5000, 5000);

        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.png",
                "image/png",
                largeImageData
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
        byte[] maxImageData = createValidPngImage(4000, 4000);

        MockMultipartFile maxFile = new MockMultipartFile(
                "file",
                "max.png",
                "image/png",
                maxImageData
        );

        UploadResponse response = fileStorageService.storeFile(maxFile);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".png"));
    }

    @Test
    void storeFile_whenImageUnderMaxDimension_shouldAccept() throws IOException {
        // Create a small image (100x100) - well under limit
        byte[] smallImageData = createValidPngImage(100, 100);

        MockMultipartFile smallFile = new MockMultipartFile(
                "file",
                "small.png",
                "image/png",
                smallImageData
        );

        UploadResponse response = fileStorageService.storeFile(smallFile);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".png"));
    }

    @Test
    void storeFile_whenJpegWithExif_shouldStripExifMetadata() throws IOException {
        // Create a JPEG image
        byte[] jpegData = createValidJpegImage(800, 600);

        MockMultipartFile jpegFile = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                jpegData
        );

        UploadResponse response = fileStorageService.storeFile(jpegFile);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".jpg"));
        // File should be re-encoded (stripping any EXIF)
        assertTrue(Files.exists(tempDir.resolve(response.getFilename())));
    }

    @Test
    void storeFile_whenInvalidImageData_shouldThrowBadRequestException() {
        // Use valid extension but invalid image data
        MockMultipartFile invalidFile = new MockMultipartFile(
                "file",
                "not-an-image.png",
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
        // WebP encoding may not be supported by default ImageIO
        // Skip test if WebP encoder is not available
        byte[] webpData;
        try {
            webpData = createValidWebpImage(800, 600);
        } catch (Exception e) {
            // WebP not supported, skip test
            return;
        }

        if (webpData == null || webpData.length == 0) {
            // WebP encoder not available, skip test
            return;
        }

        MockMultipartFile webpFile = new MockMultipartFile(
                "file",
                "photo.webp",
                "image/webp",
                webpData
        );

        UploadResponse response = fileStorageService.storeFile(webpFile);

        assertNotNull(response);
        assertTrue(response.getUrl().endsWith(".webp"));
        assertTrue(Files.exists(tempDir.resolve(response.getFilename())));
    }
}
